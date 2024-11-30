package com.team.retriever.svc.model; // Path to where this file will be placed

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "time_series_data")  // This tells MongoDB the collection name
public class TimeSeriesData {

    @Id
    private String id;  // MongoDB will automatically generate a unique ID for each document

    private String ticker;  // This is the cryptocurrency symbol (e.g., "X:BTCUSD")
    private List<List<Object>> timePrice;  // A list of timestamps and price data
    private List<List<Object>> timeVolume;  // A list of timestamps and volume data

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTicker() {
        return ticker;
    }

    public void setTicker(String ticker) {
        this.ticker = ticker;
    }

    public List<List<Object>> getTimePrice() {
        return timePrice;
    }

    public void setTimePrice(List<List<Object>> timePrice) {
        this.timePrice = timePrice;
    }

    public List<List<Object>> getTimeVolume() {
        return timeVolume;
    }

    public void setTimeVolume(List<List<Object>> timeVolume) {
        this.timeVolume = timeVolume;
    }
}
