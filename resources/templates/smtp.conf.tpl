server {
    server_name          smtp.{{it.DOMAIN}};
    {{@if(it.SSL === "true")}}
    listen               4000 ssl;
    ssl_certificate      /etc/nginx/ssl/default.crt;
    ssl_certificate_key  /etc/nginx/ssl/default.key;
    {{#else}}
    listen               4000;
    {{/if}}

    error_log   /var/log/nginx/smtp_error.log   debug;
    access_log  /var/log/nginx/smtp_access.log  main;

    location / {
        proxy_pass          http://smtp:9000;

        proxy_http_version  1.1;
        proxy_set_header    Upgrade            $http_upgrade;
        proxy_set_header    Connection         "upgrade";

        proxy_set_header    Host               $host;
        proxy_set_header    X-Real-IP          $remote_addr;
        proxy_set_header    X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto  https;
        proxy_set_header    X-Forwarded-Host   $server_name;

        proxy_read_timeout     60;
        proxy_connect_timeout  60;
        proxy_send_timeout     60;
    }
}
