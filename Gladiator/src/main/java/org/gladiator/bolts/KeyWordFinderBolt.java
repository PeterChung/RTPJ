package org.gladiator.bolts;

import backtype.storm.task.OutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.topology.base.BaseRichBolt;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Tuple;
import backtype.storm.tuple.Values;
import com.google.common.base.Charsets;
import com.google.common.base.Splitter;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.io.Resources;
import org.gladiator.utils.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import twitter4j.Status;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;

/**
 *
 * @author - Abdullah Moyeen
 * @modifiedBy - Peter Chung
 *            -- Reads word pairs from the KEYWORD.txt,
 *            -- Find the keywords from a Tweet, then emit along wiht twee
 */
public final class KeyWordFinderBolt extends BaseRichBolt {

    private static final Logger LOGGER = LoggerFactory.getLogger(KeyWordFinderBolt.class);
    private static final long serialVersionUID = 2625764791123755803L;
    private OutputCollector _outputCollector;
    private SortedMap<String, String> nameKeywordMap = null;

    public KeyWordFinderBolt() {
    }

    @Override
    public final void prepare(final Map map, final TopologyContext topologyContext,
                              final OutputCollector outputCollector) {

        nameKeywordMap = Maps.newTreeMap();
        this._outputCollector = outputCollector;

        //Bolt will read the Name-Keyword file [which is in the classpath] and store the key-value pairs to a Map.
        try {
            final URL url = Resources.getResource(Constants.NAME_KEYWORD_FILE_NAME);
            final String text = Resources.toString(url, Charsets.UTF_8);
            final Iterable<String> lineSplit = Splitter.on("\n").trimResults().omitEmptyStrings().split(text);

            List<String> tabSplit;

            for (final String str : lineSplit) {
                tabSplit = Lists.newArrayList(Splitter.on("\t").trimResults().omitEmptyStrings().split(str));
                nameKeywordMap.put(tabSplit.get(0), tabSplit.get(1));
            }
        } catch (final IOException ioException) {
            LOGGER.error(ioException.getMessage(), ioException);
            ioException.printStackTrace();
            System.exit(1);
        }
    }

    @Override
    public final void declareOutputFields(final OutputFieldsDeclarer outputFieldsDeclarer) {
        //outputFieldsDeclarer.declare(new Fields("startTick", "state", "sentiment", "tweetText", "candidateCode"));
        outputFieldsDeclarer.declare(new Fields("keyWord", "tweetText", "state"));
    }

    @Override
    public final void execute(final Tuple input) {

        //final long startTick = (long) input.getValueByField("startTick");
        final Status status = (Status) input.getValueByField("tweet");
        final String state = (String) input.getValueByField("state");
        //final int sentiment = (int) input.getValueByField("sentiment");
        //final String tweetText = getKeywordsHighlighted(status);
        final String keyword = getKeyWord(status);

        // emit tweet only when keyword is found
        if (keyword =="none") return;
        //LOGGER.info("{}", keyword);
        // now, add highlight to tweet
        final String tweetText = getKeywordsHighlighted(status);
        // then, emit
        //_outputCollector.emit(new Values(startTick, state, sentiment, tweetText, candidateCode));
        _outputCollector.emit(new Values(keyword, tweetText, state));
        //LOGGER.debug("{}:{}:{}", keyword, tweetText, state);
        //LOGGER.info("{}:{}:{}", keyword, tweetText, state);
    }

    // Gets the sentiment of the current tweet.
    private final String getKeyWord(final Status status) {

        //Remove all punctuation and new line chars in the tweet.
        final String tweet = status.getText().replaceAll("\\p{Punct}|\\n", " ").toLowerCase();

        //Splitting the tweet on empty space.
        final Iterable<String> words = Splitter.on(' ')
                .trimResults()
                .omitEmptyStrings()
                .split(tweet);

        String keyword = "none";

        //Loop thru all the words and find the candidate code based on keywords.
        for (final String word : words) {
            if (nameKeywordMap.containsKey(word)) {
                keyword = nameKeywordMap.get(word);
            }
        }

        return keyword;

    }

    // Gets the keywords highlighted in the current tweet.
    private final String getKeywordsHighlighted(final Status status) {

        String tweetText = status.getText();

        //Loop thru all the keywords and highlight them in the tweet.
        for (final String key : nameKeywordMap.keySet()) {
            tweetText = tweetText.replaceAll("(?i)(\\b" + key + "\\b)", "<mark>$1</mark>");
        }

        return tweetText;
    }
}
