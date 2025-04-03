# TLS Certificates

This directory should contain your SSL/TLS certificates for HTTPS. For security reasons, the actual certificate files are not included in the repository.

## Required Files
- `server.key` - Private key file
- `server.cert` - Certificate file

## Generating Self-Signed Certificates
For development purposes, you can generate self-signed certificates using OpenSSL:

```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate self-signed certificate
openssl req -new -x509 -key server.key -out server.cert -days 365
```

## Production
For production environments:
1. Obtain proper SSL certificates from a trusted Certificate Authority
2. Place the certificates in this directory
3. Ensure proper permissions are set on the key file (chmod 600)
4. Never commit the actual certificates to version control 