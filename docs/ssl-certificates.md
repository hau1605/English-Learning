# Production SSL Certificate Setup Guide

## Option 1: Let's Encrypt (Recommended for Production)

### 1. Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Docker
docker pull certbot/certbot
```

### 2. Generate Certificate

```bash
# Standalone mode (stop nginx first)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Or using nginx plugin (if nginx is running)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Certificate Locations

```bash
/etc/letsencrypt/live/yourdomain.com/
├── fullchain.pem  # Use for ssl_certificate
├── privkey.pem    # Use for ssl_certificate_key
├── chain.pem      # Use for ssl_trusted_certificate
└── cert.pem       # Certificate only
```

### 4. Update nginx.conf

Uncomment the Let's Encrypt lines in nginx.conf:

```nginx
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
```

### 5. Auto-renewal

```bash
# Add to crontab
sudo crontab -e

# Add this line to renew twice daily
0 0,12 * * * certbot renew --pre-hook "nginx -s reload"
```

---

## Option 2: Commercial Certificate

### 1. Purchase Certificate

Purchase from providers like:
- DigiCert
- Comodo
- GlobalSign
- Namecheap

### 2. Generate CSR

```bash
openssl req -new -newkey rsa:2048 -nodes -keyout server.key -out server.csr
```

### 3. Submit CSR to Certificate Authority

### 4. Install Certificate Files

```bash
# Certificate file
ssl_certificate /path/to/certificate.crt;

# Private key
ssl_certificate_key /path/to/server.key;

# CA Bundle (if provided)
ssl_trusted_certificate /path/to/ca-bundle.crt;
```

---

## Option 3: Self-Signed (Development Only)

### 1. Generate Self-Signed Certificate

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=VN/ST=HCM/L=HCM/O=EnglishLearningPlatform/CN=localhost"
```

### 2. Install in Docker

The docker-compose.yml already mounts nginx/ssl to the container.

---

## SSL Certificate Checklist

- [ ] Use TLS 1.2 or higher (disable TLS 1.0, TLS 1.1)
- [ ] Use strong ciphers
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Enable OCSP Stapling
- [ ] Set up auto-renewal (for Let's Encrypt)
- [ ] Redirect HTTP to HTTPS
- [ ] Update Content-Security-Policy for HTTPS
- [ ] Test SSL configuration: https://ssllabs.com/ssltest

---

## Testing SSL Configuration

### Test locally with self-signed:

```bash
# Test nginx config
docker-compose exec nginx nginx -t

# Reload nginx
docker-compose exec nginx nginx -s reload

# Test with curl (accept self-signed)
curl -k https://localhost/api/health

# Test with SSL Labs (use real domain)
# https://www.ssllabs.com/ssltest/
```

### Test with Let's Encrypt:

```bash
# Dry run renewal
sudo certbot renew --dry-run

# Test certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```
