package org.gladiator.models;

/**
 * POJO for Topology Output
 *
 * @author - Peter Chung
 */
public class TopologyOutput {

    private int count;
    private String keyword;
    //private Long startTick = 10L;
    private String tweetText;
    private String stateCode;
    //private int sentiment;

    //private String candidateCode;

    //private Long endTick=100L;
    //private Long latency= 20L;


    //public TopologyOutput(Long startTick, String stateCode, int sentiment, String tweetText, String candidateCode, Long endTick, Long latency) {
    //    this.startTick = startTick;
    //    this.stateCode = stateCode;
    //    this.sentiment = sentiment;
    //    this.tweetText = tweetText;
    //    this.candidateCode = candidateCode;
    //    this.endTick = endTick;
    //    this.latency = latency;
    public TopologyOutput(int count, String keyword, String tweetText, String stateCode) {
        this.count = count;
        this.keyword = keyword;
        this.tweetText = tweetText;
        this.stateCode = stateCode;
    }

    //public Long getStartTick() {
    //    return startTick;
    //}

    //public void setStartTick(Long startTick) {
    //    this.startTick = startTick;
    //}

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public String getKeyWord() {
        return keyword;
    }

    public void setKeyWord(String keyword) {
        this.keyword = keyword;
    }

    public String getStateCode() {
        return stateCode;
    }

    public void setStateCode(String stateCode) {
        this.stateCode = stateCode;
    }

    //public int getSentiment() {
    //    return count;
    //}

    //public void setSentiment(int sentiment) {
    //   this.count = sentiment;
    //}

    public String getTweetText() {
        return tweetText;
    }

    public void setTweetText(String tweetText) {
        this.tweetText = tweetText;
    }

    //public String getCandidateCode() {
    //    return keyword;
    //}

    //public void setCandidateCode(String candidateCode) {
    //    this.keyword = candidateCode;
    //}

    //public Long getEndTick() {
    //    return endTick;
    //}

    //public void setEndTick(Long endTick) {
    //    this.endTick = endTick;
    //}

    //public Long getLatency() {
    //    return latency;
    //}

    //public void setLatency(Long latency) {
    //    this.latency = latency;
    //}

    @Override
    //public String toString() {
    //    return new StringBuffer(" startTick : ").append(this.startTick).append(" stateCode : ").append(this.stateCode).append(" sentiment : ").append(this.sentiment).append(" tweetText : ").append(this.tweetText).append(" candidateCode : ").append(this.candidateCode).append(" endTick : ").append(this.endTick).append(" latency : ").append(this.latency).toString();
    //}
    public String toString() {
        return new StringBuffer(" count : ").append(this.count).append(" keyword : ").append(this.keyword).append(" tweetText : ").append(this.tweetText).append(" stateCode : ").append(this.stateCode).toString();
        //return new StringBuffer(" startTick : ").append(this.startTick).append(" stateCode : ").append(this.stateCode).append(" sentiment : ").append(this.count).append(" tweetText : ").append(this.tweetText).append(" candidateCode : ").append(this.keyword).append(" endTick : ").append(this.endTick).append(" latency : ").append(this.latency).toString();
    }

}
