module.exports = class InitiatorConfig {
  constructor() {
    this.packages = {}
    this.files = {}
  }

  addFile(name, contents) {
    this.files[name] = contents
  }

  addPackage(name, version) {
    this.packages[name] = version
  }
}
