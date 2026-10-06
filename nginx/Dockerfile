FROM nginx:alpine
LABEL author="Pranit Bhangale"

# Remove default nginx config and replace with custom static configuration
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/conf.d/default.conf

# Copy SSL certificates
COPY ssl/docmind.crt /etc/nginx/ssl/docmind.crt
COPY ssl/docmind.key /etc/nginx/ssl/docmind.key

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
