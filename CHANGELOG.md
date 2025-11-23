# Changelog

## v1.2.0 (2025-11-23)

### 🚀 New Features

**SAP Data Update Support - Send Data TO SAP!**
- Added support for `importStructures` - populate structures and send to SAP
- Added support for `importTables` - create table rows and send to SAP
- Full vendor update functionality (create/update vendor data)
- Bidirectional SAP integration (read AND write)
- Bridge communication verified and tested

### 🔧 .NET Backend Enhancements
- Enhanced `InvokeComplex()` method to handle input structures
- Added logic to populate and send table rows to SAP
- Improved error handling for structure/table population
- Verified Node.js ↔ .NET communication layer

### 📚 New Examples
- `examples/vendor-update.js` - Complete vendor update example
- `examples/update-patterns.js` - Various data update patterns

### 📖 New Documentation
- `VENDOR_UPDATE_GUIDE.md` - Complete guide for updating SAP data
- `BRIDGE_TEST_SUMMARY.md` - Communication layer verification
- `TEST_RESULTS.md` - Test results documentation

### 🔧 API Enhancements
- `invokeFunction()` now supports:
  - `importStructures` - send structures TO SAP (like SetValue on structure)
  - `importTables` - send table rows TO SAP (like table.Append)
  
### 💡 Use Cases
Now supports complete SAP operations:
- ✅ Read vendor data
- ✅ Update vendor data
- ✅ Create/update orders
- ✅ Send any data to SAP
- ✅ Full CRUD operations

Perfect for:
- Vendor management
- Order creation
- Invoice updates
- Master data maintenance
- Any SAP data updates

---

## v1.1.0 (2025-11-23)

### 🚀 New Features

**Generic RFC Support**
- Added `invokeFunction()` method with full SAP NCo capabilities
- Support for structures (read from SAP)
- Support for tables (read from SAP)
- Export parameters support
- Session management (endContext)

### 📚 New Examples
- `examples/generic-rfc.js` - Multiple RFC examples
- `examples/vendor-data.js` - Vendor data retrieval

### 📖 New Documentation
- `GENERIC_RFC_GUIDE.md` - Complete generic RFC guide
- Enhanced README with full API documentation

### 🔧 API Changes
- Added `invokeFunction(params)` method
- Returns structured data:
  - `exports` - Export parameters
  - `structures` - SAP structures
  - `tables` - SAP tables

---

## v1.0.0 (2025-11-23)

### 🎉 Initial Release

**Core Features**
- SAP RFC connectivity via .NET NCo backend
- Zero runtime dependencies
- TypeScript support
- Connection management
- Basic RFC invocation

**Methods**
- `connect()` - Connect to SAP
- `ping()` - Test connection
- `invoke()` - Simple RFC calls
- `close()` - Close connection

**Platform**
- Windows x64
- .NET Framework 4.8
- Node.js 12+

**Examples**
- `examples/basic.js` - Basic connection
- `examples/custom-rfc.js` - Custom RFC
- `examples/error-handling.js` - Error handling

**Documentation**
- README.md - Complete documentation
- GETTING_STARTED.md - Quick start guide
- LICENSE - MIT License

---

## Release Notes

### v1.2.0 Highlights
This release adds **full bidirectional SAP integration**. You can now not only READ from SAP but also WRITE/UPDATE data in SAP systems. Perfect for vendor management, order creation, and master data maintenance.

### v1.1.0 Highlights
This release added generic RFC support, allowing you to call any SAP function with structures and tables.

### v1.0.0 Highlights
Initial production-ready release with core SAP connectivity features.

---

## Upgrade Guide

### From 1.1.0 to 1.2.0
No breaking changes! Just install the new version:
```bash
npm update sap-rfc-node-net
```

New features are opt-in through the `invokeFunction()` method.

### From 1.0.0 to 1.1.0
No breaking changes! The `invoke()` method still works as before.

---

## Future Roadmap

- [ ] Cross-platform support (.NET Core)
- [ ] macOS support
- [ ] Linux support
- [ ] Connection pooling improvements
- [ ] Performance optimizations
- [ ] More examples and guides

---

**Stay updated:** https://www.npmjs.com/package/sap-rfc-node-net
