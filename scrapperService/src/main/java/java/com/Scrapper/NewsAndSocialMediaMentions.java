package com.Scrapper;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.cdimascio.dotenv.Dotenv;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class NewsAndSocialMediaMentions {
    private static final String NEWS_API_KEY = Dotenv.load().get("NEWS_API_KEY");
    private static final String REDDIT_CLIENT_ID = Dotenv.load().get("REDDIT_CLIENT_ID");
    private static final String REDDIT_CLIENT_SECRET = Dotenv.load().get("REDDIT_CLIENT_SECRET");
    private static final String REDDIT_USER_AGENT = "Crypto DashBoard";

    private static final String NEWS_BASE_URL = "https://newsapi.org/v2/everything";
    private static final String REDDIT_AUTH_URL = "https://www.reddit.com/api/v1/access_token";
    private static final String REDDIT_SEARCH_URL = "https://oauth.reddit.com/search";
    private static final String GROWTH_SERVICE_URL = "http://growth-svc:3000/process-data";


    private static final Map<String, List<String>> CRYPTO_KEYWORDS = Map.ofEntries(
        Map.entry("X:BTCUSD", List.of("BTC", "Bitcoin")),
        Map.entry("X:ETHUSD", List.of("ETH", "Ethereum")),
        Map.entry("X:SOLUSD", List.of("SOL", "Solana")),
        Map.entry("X:XRPUSD", List.of("XRP", "Ripple")),
        Map.entry("X:DOGEUSD", List.of("DOGE", "Dogecoin")),
        Map.entry("X:ADAUSD", List.of("ADA", "Cardano")),
        Map.entry("X:TRXUSD", List.of("TRX", "TRON")),
        Map.entry("X:SHIBUSD", List.of("SHIB", "Shiba Inu")),
        Map.entry("X:AVAXUSD", List.of("AVAX", "Avalanche")),
        Map.entry("X:TONUSD", List.of("TON", "Toncoin"))
    
    );

    public static void main(String[] args) {
        // Schedule the scraper service to run every 24 hours
        Timer timer = new Timer(true);
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                try {
                    executeScraping();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }, 0, 24 * 60 * 60 * 1000); // Every 24 hours

        System.out.println("Scraper Service is running...");
        while (true) {} // Keep the service running
    }

    private static void executeScraping() throws Exception {
        Map<String, Integer> newsCounts = processNewsAPI();
        Map<String, Integer> redditCounts = new HashMap<>();

        String redditAccessToken = getRedditAccessToken();
        if (redditAccessToken != null) {
            redditCounts = processRedditAPI(redditAccessToken);
        }

        Map<String, Map<String, Integer>> aggregatedCounts = new HashMap<>();
        aggregatedCounts.put("news", newsCounts);
        aggregatedCounts.put("socialMedia", redditCounts);

        String jsonOutput = new ObjectMapper().writeValueAsString(aggregatedCounts);
        saveToJsonFile(aggregatedCounts, "crypto_mention_counts.json");

        // Send JSON data to Growth Service
        sendToGrowthService(jsonOutput);
    }

    private static Map<String, Integer> processNewsAPI() {
        Map<String, Integer> cryptoCounts = initializeCryptoCounts();

        try {
            String fromDate = LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ISO_DATE_TIME);
            String url = NEWS_BASE_URL + "?q=" +
                    String.join("+OR+", List.of("crypto", "cryptocurrency", "Bitcoin", "Ethereum")) +
                    "&from=" + fromDate + "&sortBy=publishedAt&pageSize=100&apiKey=" + NEWS_API_KEY;

            HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestMethod("GET");

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder responseBody = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
                reader.close();
                countMentionsInNews(responseBody.toString(), cryptoCounts);
            } else {
                System.out.println("Failed to fetch NewsAPI articles. HTTP Status Code: " + responseCode);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return cryptoCounts;
    }

    private static String getRedditAccessToken() {
        try {
            String credentials = REDDIT_CLIENT_ID + ":" + REDDIT_CLIENT_SECRET;
            String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());

            HttpURLConnection connection = (HttpURLConnection) new URL(REDDIT_AUTH_URL).openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Authorization", "Basic " + encodedCredentials);
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            connection.setDoOutput(true);

            try (DataOutputStream writer = new DataOutputStream(connection.getOutputStream())) {
                writer.writeBytes("grant_type=client_credentials");
                writer.flush();
            }

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder responseBody = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
                reader.close();

                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode responseJson = objectMapper.readTree(responseBody.toString());
                return responseJson.path("access_token").asText();
            } else {
                System.out.println("Failed to get Reddit access token. HTTP Status Code: " + responseCode);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private static Map<String, Integer> processRedditAPI(String accessToken) {
        Map<String, Integer> cryptoCounts = initializeCryptoCounts();

        try {
            String query = URLEncoder.encode(String.join(" OR ", CRYPTO_KEYWORDS.keySet()), StandardCharsets.UTF_8);
            String url = REDDIT_SEARCH_URL + "?q=" + query + "&sort=new&limit=100";

            HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestProperty("Authorization", "Bearer " + accessToken);
            connection.setRequestProperty("User-Agent", REDDIT_USER_AGENT);

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder responseBody = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
                reader.close();
                countMentionsInReddit(responseBody.toString(), cryptoCounts);
            } else {
                System.out.println("Failed to fetch Reddit posts. HTTP Status Code: " + responseCode);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return cryptoCounts;
    }

    private static void countMentionsInNews(String jsonResponse, Map<String, Integer> cryptoCounts) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode articles = objectMapper.readTree(jsonResponse).path("articles");

            for (JsonNode article : articles) {
                String title = article.path("title").asText("");
                CRYPTO_KEYWORDS.forEach((key, keywords) ->
                        keywords.forEach(keyword -> {
                            if (title.toLowerCase().contains(keyword.toLowerCase())) {
                                cryptoCounts.put(key, cryptoCounts.getOrDefault(key, 0) + 1);
                            }
                        }));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void countMentionsInReddit(String jsonResponse, Map<String, Integer> cryptoCounts) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode posts = objectMapper.readTree(jsonResponse).path("data").path("children");

            for (JsonNode post : posts) {
                String title = post.path("data").path("title").asText("");
                CRYPTO_KEYWORDS.forEach((key, keywords) ->
                        keywords.forEach(keyword -> {
                            if (title.toLowerCase().contains(keyword.toLowerCase())) {
                                cryptoCounts.put(key, cryptoCounts.getOrDefault(key, 0) + 1);
                            }
                        }));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Map<String, Integer> initializeCryptoCounts() {
        Map<String, Integer> cryptoCounts = new HashMap<>();
        CRYPTO_KEYWORDS.keySet().forEach(key -> cryptoCounts.put(key, 0));
        return cryptoCounts;
    }

    private static void saveToJsonFile(Map<String, Map<String, Integer>> data, String fileName) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.writeValue(new FileWriter(fileName), data);
            System.out.println("Data saved to file: " + fileName);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void sendToGrowthService(String jsonData) {
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(GROWTH_SERVICE_URL).openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            try (DataOutputStream writer = new DataOutputStream(connection.getOutputStream())) {
                writer.writeBytes(jsonData);
                writer.flush();
            }

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                System.out.println("Data successfully sent to Growth Service.");
            } else {
                System.out.println("Failed to send data to Growth Service. HTTP Status Code: " + responseCode);
            }
        } catch (Exception e) {
            System.out.println("ERROR!!");
            e.printStackTrace();
        }
    }
}
