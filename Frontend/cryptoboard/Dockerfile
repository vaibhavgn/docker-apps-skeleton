# Step 1: Use an official Node.js image to build the app
FROM node:alpine AS build

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Build the app for production
RUN npm run build

# Step 7: Use an Nginx image to serve the built app
FROM nginx:1.25
# Step 8: Copy build files to Nginx's default static folder
COPY --from=build /app/build /usr/share/nginx/html

# Step 9: Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Step 10: Expose the port on which the app will run
EXPOSE 80

# Step 11: Start Nginx server
CMD ["nginx", "-g", "daemon off;"]