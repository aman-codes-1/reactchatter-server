#!/bin/sh

# Export environment variables to make them available to envsubst
export PORT="$PORT"
export REACT_APP_PROXY_URI="$REACT_APP_PROXY_URI"
export REACT_APP_SERVER_URI="$REACT_APP_SERVER_URI"
export REACT_APP_PROXY_DOMAIN="$REACT_APP_PROXY_DOMAIN"

# Use envsubst to replace variables directly in nginx.conf and create a temporary file
envsubst '$PORT $REACT_APP_PROXY_URI $REACT_APP_SERVER_URI $REACT_APP_PROXY_DOMAIN' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp

# Move the temporary file to replace the original nginx.conf
mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf

# Start Nginx with the provided command line arguments
exec "$@"