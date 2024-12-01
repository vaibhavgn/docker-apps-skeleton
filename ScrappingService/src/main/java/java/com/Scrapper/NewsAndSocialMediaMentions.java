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

    private static final Map<String, List<String>> CRYPTO_KEYWORDS = Map.ofEntries(
    Map.entry("X:BTCUSD", List.of("BTC", "Bitcoin")),
    Map.entry("X:ETHUSD", List.of("ETH", "Ethereum")),
    Map.entry("X:USDTUSD", List.of("USDT", "Tether")),
    Map.entry("X:BNBUSD", List.of("BNB", "Binance Coin")),
    Map.entry("X:XRPUSD", List.of("XRP", "Ripple")),
    Map.entry("X:ADAUSD", List.of("ADA", "Cardano")),
    Map.entry("X:SOLUSD", List.of("SOL", "Solana")),
    Map.entry("X:DOGEUSD", List.of("DOGE", "Dogecoin")),
    Map.entry("X:TRXUSD", List.of("TRX", "TRON")),
    Map.entry("X:AVAXUSD", List.of("AVAX", "Avalanche")),
    Map.entry("X:TONUSD", List.of("TON", "Toncoin"))
);


    public static void main(String[] args) {
        try {
            Map<String, Integer> newsCounts = processNewsAPI();
            Map<String, Integer> redditCounts = new HashMap<>();
            
            String redditAccessToken = getRedditAccessToken();
            if (redditAccessToken != null) {
                redditCounts = processRedditAPI(redditAccessToken);
            }

            Map<String, Map<String, Integer>> aggregatedCounts = new HashMap<>();
            aggregatedCounts.put("news", newsCounts);
            aggregatedCounts.put("socialMedia", redditCounts);

            saveToJsonFile(aggregatedCounts, "crypto_mention_counts.json");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Map<String, Integer> processNewsAPI() {
        Map<String, Integer> cryptoCounts = initializeCryptoCounts();

        try {
            String fromDate = LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ISO_DATE_TIME);
            String url = NEWS_BASE_URL + "?q=crypto&from=" + fromDate + "&apiKey=" + NEWS_API_KEY;

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

            String requestBody = "grant_type=client_credentials";
            try (DataOutputStream writer = new DataOutputStream(connection.getOutputStream())) {
                writer.writeBytes(requestBody);
                writer.flush();
            }

            int responseCode = connection.getResponseCode();
            //System.out.println("Reddit Auth Response Code: " + responseCode);

            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder responseBody = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
                reader.close();

                //System.out.println("Reddit Auth Response: " + responseBody);

                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode responseJson = objectMapper.readTree(responseBody.toString());
                String accessToken = responseJson.path("access_token").asText();
                return accessToken;
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

            //System.out.println("Reddit API URL: " + url);

            HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestProperty("Authorization", "Bearer " + accessToken);
            connection.setRequestProperty("User-Agent", REDDIT_USER_AGENT);

            int responseCode = connection.getResponseCode();
            //System.out.println("Reddit API Response Code: " + responseCode);

            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder responseBody = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    responseBody.append(line);
                }
                reader.close();

                //System.out.println("Reddit API Response: " + responseBody);
                countMentionsInReddit(responseBody.toString(), cryptoCounts);
            } else {
                System.out.println("Failed to fetch Reddit posts. HTTP Status Code: " + responseCode);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return cryptoCounts;
    }

   
    private static void countMentionsInReddit(String jsonResponse, Map<String, Integer> cryptoCounts) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            JsonNode posts = rootNode.path("data").path("children");

            if (!posts.isArray()) {
                System.out.println("Unexpected JSON structure for Reddit API response.");
                return;
            }

            for (JsonNode post : posts) {
                String title = post.path("data").path("title").asText(null);
                if (title == null || title.isEmpty()) {
                    //System.out.println("Skipped Reddit post without a title.");
                    continue;
                }
                //System.out.println("Processing Reddit Title: " + title);

                for (Map.Entry<String, List<String>> entry : CRYPTO_KEYWORDS.entrySet()) {
                    for (String keyword : entry.getValue()) {
                        if (title.toLowerCase().contains(keyword.toLowerCase())) {
                            cryptoCounts.put(entry.getKey(), cryptoCounts.get(entry.getKey()) + 1);
                            //System.out.println("Matched Keyword: " + keyword + " in Reddit Title: " + title);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void countMentionsInNews(String jsonResponse, Map<String, Integer> cryptoCounts) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            JsonNode articles = rootNode.path("articles");

            if (!articles.isArray()) {
                System.out.println("Unexpected JSON structure for News API response.");
                return;
            }

            for (JsonNode article : articles) {
                String title = article.path("title").asText(null);
                if (title == null || title.isEmpty()) {
                    //System.out.println("Skipped article without a title.");
                    continue;
                }
                //System.out.println("Processing News Title: " + title);

                for (Map.Entry<String, List<String>> entry : CRYPTO_KEYWORDS.entrySet()) {
                    for (String keyword : entry.getValue()) {
                        if (title.toLowerCase().contains(keyword.toLowerCase())) {
                            cryptoCounts.put(entry.getKey(), cryptoCounts.get(entry.getKey()) + 1);
                            //System.out.println("Matched Keyword: " + keyword + " in News Title: " + title);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Map<String, Integer> initializeCryptoCounts() {
        Map<String, Integer> cryptoCounts = new HashMap<>();
        for (String crypto : CRYPTO_KEYWORDS.keySet()) {
            cryptoCounts.put(crypto, 0);
        }
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
}

