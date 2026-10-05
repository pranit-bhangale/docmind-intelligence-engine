FROM nginx:alpine
LABEL author="Pranit Bhangale"
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template \
     /etc/nginx/templates/nginx.conf.template

COPY ssl/docmind.crt \
     /etc/nginx/ssl/docmind.crt

COPY ssl/docmind.key \
     /etc/nginx/ssl/docmind.key

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
