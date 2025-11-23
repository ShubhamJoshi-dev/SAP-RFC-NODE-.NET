using System;
using System.Collections.Generic;
using System.Text.Json;
using SAP.Middleware.Connector;

namespace SapRfcBridge
{
    /// <summary>
    /// SAP RFC Bridge - Cross-platform .NET Core version
    /// </summary>
    class SapRfcConnector
    {
        private static SapDestinationConfig? _config;
        private const string DESTINATION = "DEFAULT";

        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                Error("No command specified");
                return;
            }

            try
            {
                string cmd = args[0].ToLower();
                string json = args.Length > 1 ? string.Join(" ", args, 1, args.Length - 1) : "{}";

                switch (cmd)
                {
                    case "connect": Connect(json); break;
                    case "ping": Ping(); break;
                    case "invoke": Invoke(json); break;
                    case "close": Close(); break;
                    default: Error($"Unknown command: {cmd}"); break;
                }
            }
            catch (Exception ex)
            {
                Error(ex.Message, ex.StackTrace);
            }
        }

        static void Connect(string json)
        {
            var cfg = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            if (cfg == null) throw new InvalidOperationException("Invalid config");

            _config = new SapDestinationConfig();
            var parms = new RfcConfigParameters
            {
                [RfcConfigParameters.AppServerHost] = cfg["host"],
                [RfcConfigParameters.Client] = cfg["client"],
                [RfcConfigParameters.SystemNumber] = cfg["sysNr"],
                [RfcConfigParameters.User] = cfg["user"],
                [RfcConfigParameters.Password] = cfg["password"],
                [RfcConfigParameters.Language] = cfg.ContainsKey("lang") ? cfg["lang"] : "EN",
                [RfcConfigParameters.PoolSize] = cfg.ContainsKey("poolSize") ? cfg["poolSize"] : "5",
                [RfcConfigParameters.ConnectionIdleTimeout] = "600"
            };

            _config.AddDestination(DESTINATION, parms);
            _config.Register();

            var dest = RfcDestinationManager.GetDestination(DESTINATION);
            dest.Ping();

            Success(new
            {
                connected = true,
                systemId = dest.SystemAttributes.SystemID,
                client = dest.SystemAttributes.Client,
                release = dest.SystemAttributes.PartnerRelease
            });
        }

        static void Ping()
        {
            var dest = RfcDestinationManager.GetDestination(DESTINATION);
            dest.Ping();
            Success(new { alive = true });
        }

        static void Invoke(string json)
        {
            var req = JsonSerializer.Deserialize<Dictionary<string, object>>(json);
            if (req == null) throw new InvalidOperationException("Invalid request");
            
            var funcName = req["function"].ToString();
            if (funcName == null) throw new InvalidOperationException("No function name");

            var dest = RfcDestinationManager.GetDestination(DESTINATION);
            var func = dest.Repository.CreateFunction(funcName);

            if (req.ContainsKey("params") && req["params"] != null)
            {
                var parmsJson = JsonSerializer.Serialize(req["params"]);
                var parms = JsonSerializer.Deserialize<Dictionary<string, object>>(parmsJson);
                if (parms != null)
                {
                    foreach (var p in parms)
                        func.SetValue(p.Key, p.Value);
                }
            }

            func.Invoke(dest);

            var result = new Dictionary<string, string>();
            for (int i = 0; i < func.Metadata.ParameterCount; i++)
            {
                var meta = func.Metadata[i];
                if (meta.Direction == RfcDirection.EXPORT || meta.Direction == RfcDirection.CHANGING)
                {
                    try { result[meta.Name] = func.GetValue(meta.Name)?.ToString() ?? ""; }
                    catch { result[meta.Name] = ""; }
                }
            }

            Success(result);
        }

        static void Close()
        {
            _config?.Unregister();
            Success(new { closed = true });
        }

        static void Success(object data)
        {
            var response = new { success = true, data };
            Console.WriteLine(JsonSerializer.Serialize(response));
        }

        static void Error(string msg, string? trace = null)
        {
            var response = new { success = false, error = msg, trace };
            Console.WriteLine(JsonSerializer.Serialize(response));
        }
    }

    class SapDestinationConfig : IDestinationConfiguration
    {
        private readonly Dictionary<string, RfcConfigParameters> _dests = new();
        private bool _registered = false;

        public void AddDestination(string name, RfcConfigParameters parms)
        {
            _dests[name] = parms;
        }

        public void Register()
        {
            if (!_registered)
            {
                RfcDestinationManager.RegisterDestinationConfiguration(this);
                _registered = true;
            }
        }

        public void Unregister()
        {
            if (_registered)
            {
                RfcDestinationManager.UnregisterDestinationConfiguration(this);
                _registered = false;
            }
        }

        public RfcConfigParameters GetParameters(string name)
        {
            if (_dests.ContainsKey(name)) return _dests[name];
            throw new ArgumentException($"Destination {name} not found");
        }

        public bool ChangeEventsSupported() => false;

#pragma warning disable 67
        public event RfcDestinationManager.ConfigurationChangeHandler? ConfigurationChanged;
#pragma warning restore 67
    }
}

