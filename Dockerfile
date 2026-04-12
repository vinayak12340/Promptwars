# Use the official Nginx image as a base
FROM nginx:alpine

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx config inside the container at the default location
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all the static HTML/CSS/JS/PNG files from the current directory to the Nginx html folder
COPY . /usr/share/nginx/html

# Expose port 8080 (Google Cloud Run requires the app to listen on 8080 by default)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
