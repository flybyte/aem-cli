server {
    server_name          publish.{{it.DOMAIN}};
    {{@if(it.SSL === "true")}}
    listen               4000 ssl;
    ssl_certificate      /etc/nginx/ssl/default.crt;
    ssl_certificate_key  /etc/nginx/ssl/default.key;
    {{#else}}
    listen               4000;
    {{/if}}

    error_log   /var/log/nginx/publish_error.log   debug;
    access_log  /var/log/nginx/publish_access.log  main;

    location / {
        proxy_pass         http://publish:4500;

        proxy_set_header   Host               $host;
        proxy_set_header   X-Real-IP          $remote_addr;
        proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto  https;
        proxy_set_header   X-Forwarded-Host   $server_name;

        proxy_read_timeout     60;
        proxy_connect_timeout  60;
        proxy_send_timeout     60;

        add_header 'Access-Control-Allow-Origin' "$http_origin" always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Headers' "Authorization, Origin, X-Requested-With, Content-Type, Accept" always;
        add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
    }
}
