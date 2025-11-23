using System;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using SAP.Middleware.Connector;

namespace SapRfcBridge
{
    /// <summary>
    /// SAP RFC Bridge - CLI interface for Node.js integration
    /// </summary>
    class SapRfcConnector
    {
        private static SapDestinationConfig _config;
        private const string DESTINATION = "DEFAULT";
        private static bool _isConnected = false;

        static void CheckDlls()
        {
            var exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
            var exeDir = System.IO.Path.GetDirectoryName(exePath);
            
            var sapncoDll = System.IO.Path.Combine(exeDir, "sapnco.dll");
            var sapncoUtilsDll = System.IO.Path.Combine(exeDir, "sapnco_utils.dll");
            
            var missing = new System.Collections.Generic.List<string>();
            
            if (!System.IO.File.Exists(sapncoDll))
                missing.Add("sapnco.dll");
            
            if (!System.IO.File.Exists(sapncoUtilsDll))
                missing.Add("sapnco_utils.dll");
            
            if (missing.Count > 0)
            {
                var msg = string.Format(
                    "Missing SAP NCo DLLs in {0}:\n\n" +
                    "Missing files: {1}\n\n" +
                    "Please copy the following files to this folder:\n" +
                    "- sapnco.dll\n" +
                    "- sapnco_utils.dll\n\n" +
                    "Download from: https://support.sap.com/nco\n\n" +
                    "Copy commands:\n" +
                    "  copy sapnco.dll \"{0}\"\n" +
                    "  copy sapnco_utils.dll \"{0}\"",
                    exeDir,
                    string.Join(", ", missing.ToArray())
                );
                
                throw new System.IO.FileNotFoundException(msg);
            }
        }

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
                    case "connect": CheckDlls(); Connect(json); break;
                    case "ping": CheckDlls(); Ping(); break;
                    case "sync": Sync(); break;
                    case "invoke": CheckDlls(); Invoke(json); break;
                    case "invokecomplex": CheckDlls(); InvokeComplex(json); break;
                    case "checkdlls": CheckDlls(); Success(new { dlls_found = true, message = "All SAP NCo DLLs found" }); break;
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
            var ser = new JavaScriptSerializer();
            var cfg = ser.Deserialize<Dictionary<string, string>>(json);

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
                [RfcConfigParameters.PeakConnectionsLimit] = cfg.ContainsKey("PeakConnectionLimit") ? cfg["PeakConnectionLimit"] : "10",
                [RfcConfigParameters.ConnectionIdleTimeout] = cfg.ContainsKey("connectionIdleTimeout") ? cfg["connectionIdleTimeout"] : "600"
            };

            _config.AddDestination(DESTINATION, parms);
            _config.Register();

            var dest = RfcDestinationManager.GetDestination(DESTINATION);
            dest.Ping();

            _isConnected = true;

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
            if (!_isConnected)
            {
                Error("Not connected to SAP. Please call connect() first.");
                return;
            }

            var dest = RfcDestinationManager.GetDestination(DESTINATION);
            dest.Ping();
            Success(new { alive = true });
        }

        static void CheckConnection()
        {
            if (!_isConnected)
            {
                throw new InvalidOperationException("Not connected to SAP. Please call connect() first before executing RFC functions.");
            }
        }

        static void Sync()
        {
            Success(new { sync = true, message = "successfully sync" });
        }

        static void Invoke(string json)
        {
            CheckConnection();
            
            var ser = new JavaScriptSerializer();
            var req = ser.Deserialize<Dictionary<string, object>>(json);
            var funcName = req["function"].ToString();

            var dest = RfcDestinationManager.GetDestination(DESTINATION);
            var func = dest.Repository.CreateFunction(funcName);

            if (req.ContainsKey("params"))
            {
                var parms = ser.Deserialize<Dictionary<string, object>>(req["params"].ToString());
                foreach (var p in parms)
                    func.SetValue(p.Key, p.Value);
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

        static void InvokeComplex(string json)
        {
            CheckConnection();
            
            var ser = new JavaScriptSerializer();
            var req = ser.Deserialize<Dictionary<string, object>>(json);
            
            var funcName = req["function"].ToString();
            var dest = RfcDestinationManager.GetDestination(DESTINATION);
            var repo = dest.Repository;
            var func = repo.CreateFunction(funcName);

            // Set simple import parameters
            if (req.ContainsKey("importParams"))
            {
                var importParams = ser.Deserialize<Dictionary<string, object>>(req["importParams"].ToString());
                foreach (var param in importParams)
                {
                    func.SetValue(param.Key, param.Value);
                }
            }

            // Set import structures (populate and set to function)
            if (req.ContainsKey("importStructures"))
            {
                var importStructs = ser.Deserialize<Dictionary<string, object>>(req["importStructures"].ToString());
                foreach (var structEntry in importStructs)
                {
                    var structName = structEntry.Key;
                    var structData = ser.Deserialize<Dictionary<string, object>>(structEntry.Value.ToString());
                    
                    var structure = func.GetStructure(structName);
                    foreach (var field in structData)
                    {
                        try { structure.SetValue(field.Key, field.Value); }
                        catch { }
                    }
                }
            }

            // Set import tables (populate rows and set to function)
            if (req.ContainsKey("importTables"))
            {
                var importTbls = ser.Deserialize<Dictionary<string, object>>(req["importTables"].ToString());
                foreach (var tableEntry in importTbls)
                {
                    var tableName = tableEntry.Key;
                    var tableRows = ser.Deserialize<List<object>>(tableEntry.Value.ToString());
                    
                    var table = func.GetTable(tableName);
                    
                    foreach (var rowObj in tableRows)
                    {
                        var rowData = ser.Deserialize<Dictionary<string, object>>(rowObj.ToString());
                        table.Append();
                        table.CurrentIndex = table.RowCount - 1;
                        
                        foreach (var field in rowData)
                        {
                            try { table.SetValue(field.Key, field.Value); }
                            catch { }
                        }
                    }
                }
            }

            // Invoke the function
            func.Invoke(dest);

            var result = new Dictionary<string, object>();

            // Get export parameters (strings/scalars)
            if (req.ContainsKey("exportParams") && req["exportParams"] != null)
            {
                var exportNames = ser.Deserialize<List<string>>(req["exportParams"].ToString());
                var exports = new Dictionary<string, string>();
                foreach (var name in exportNames)
                {
                    try { exports[name] = func.GetString(name) ?? ""; }
                    catch { exports[name] = ""; }
                }
                result["exports"] = exports;
            }

            // Get structures
            if (req.ContainsKey("structures") && req["structures"] != null)
            {
                var structNames = ser.Deserialize<List<string>>(req["structures"].ToString());
                var structures = new Dictionary<string, Dictionary<string, string>>();
                
                foreach (var structName in structNames)
                {
                    var structData = new Dictionary<string, string>();
                    try
                    {
                        var structure = func.GetStructure(structName);
                        for (int i = 0; i < structure.Metadata.FieldCount; i++)
                        {
                            var field = structure.Metadata[i];
                            try { structData[field.Name] = structure.GetString(field.Name) ?? ""; }
                            catch { structData[field.Name] = ""; }
                        }
                    }
                    catch { }
                    structures[structName] = structData;
                }
                result["structures"] = structures;
            }

            // Get tables
            if (req.ContainsKey("tables") && req["tables"] != null)
            {
                var tableNames = ser.Deserialize<List<string>>(req["tables"].ToString());
                var tables = new Dictionary<string, List<Dictionary<string, string>>>();
                
                foreach (var tableName in tableNames)
                {
                    var tableData = new List<Dictionary<string, string>>();
                    try
                    {
                        var table = func.GetTable(tableName);
                        for (int row = 0; row < table.RowCount; row++)
                        {
                            table.CurrentIndex = row;
                            var rowData = new Dictionary<string, string>();
                            for (int i = 0; i < table.Metadata.LineType.FieldCount; i++)
                            {
                                var field = table.Metadata.LineType[i];
                                try { rowData[field.Name] = table.GetString(field.Name) ?? ""; }
                                catch { rowData[field.Name] = ""; }
                            }
                            tableData.Add(rowData);
                        }
                    }
                    catch { }
                    tables[tableName] = tableData;
                }
                result["tables"] = tables;
            }

            // End SAP context
            if (req.ContainsKey("endContext") && req["endContext"].ToString().ToLower() == "true")
            {
                RfcSessionManager.EndContext(dest);
            }

            Success(result);
        }

        static void Close()
        {
            _config?.Unregister();
            _isConnected = false;
            Success(new { closed = true });
        }

        static void Success(object data)
        {
            var ser = new JavaScriptSerializer();
            Console.WriteLine(ser.Serialize(new { success = true, data }));
        }

        static void Error(string msg, string trace = null)
        {
            var ser = new JavaScriptSerializer();
            Console.WriteLine(ser.Serialize(new { success = false, error = msg, trace }));
        }
    }

    class SapDestinationConfig : IDestinationConfiguration
    {
        private readonly Dictionary<string, RfcConfigParameters> _dests = new Dictionary<string, RfcConfigParameters>();
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
        public event RfcDestinationManager.ConfigurationChangeHandler ConfigurationChanged;
#pragma warning restore 67
    }
}

