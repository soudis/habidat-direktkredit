# Changelog

### 0.0.16

Adding validation for account store mappings.  We now error if:

* No account stores are mapped to the given application.

* The given application does not have a default account store, and
  `stormpath.web.register.enabled` is `true`

### 0.0.15

Patch for 0.0.14 - fixing a null reference.

### 0.0.14

Adding a temporary patch to `ExtendConfigStrategy` to ensure that prototype
methods are not lost on `config.cacheOptions.client`.  The patch manually
replaces this property, in the future we intend to fix the extension algorithm
to support this case.

### 0.0.13

Modified `EnrichClientFromRemoteConfigStrategy` to implement the proper
application resolution strategiey: load application by name or href, fallback
to ony application if that is the case.