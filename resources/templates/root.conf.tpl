{{@if(it.SSL === "true")}}
server {
    listen 80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}
{{/if}}


server {
    server_name          _;
    listen               443 ssl default_server;
    ssl_certificate      /etc/nginx/ssl/default.crt;
    ssl_certificate_key  /etc/nginx/ssl/default.key;

    error_log   /var/log/nginx/root_error.log   debug;
    access_log  /var/log/nginx/root_access.log  main;

    location / {
        root  /usr/share/nginx/html;
    }
}
