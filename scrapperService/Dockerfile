# Use Maven for building the application
FROM maven:3.8-openjdk-11 AS build
WORKDIR /app
COPY . .
RUN mvn clean package

# Use a lightweight JRE image for running the application
FROM openjdk:11-jre-slim
WORKDIR /app

# Copy the built JAR file from the Maven build stage
COPY --from=build /app/target/webcrawler-1.0-SNAPSHOT.jar /app/webcrawler-1.0-SNAPSHOT.jar

# Copy the .env file into the container
COPY .env /app/.env

# Set the environment variable to point to the .env file
ENV DOTENV_PATH=/app/.env

# Run the application
ENTRYPOINT ["java", "-jar", "/app/webcrawler-1.0-SNAPSHOT.jar"]
