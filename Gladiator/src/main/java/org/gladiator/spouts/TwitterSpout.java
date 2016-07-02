package org.gladiator.spouts;

import backtype.storm.spout.SpoutOutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.topology.base.BaseRichSpout;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Values;
import backtype.storm.utils.Utils;
import com.google.common.base.Charsets;
import com.google.common.base.Splitter;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.io.Resources;
import org.gladiator.utils.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import twitter4j.*;
import twitter4j.conf.ConfigurationBuilder;
import java.io.IOException;
import java.net.URL;
import java.util.*;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Spout which gets tweets from Twitter using OAuth Credentials.
 *
 * @author - Prashanth Babu, Abdullah Moyeen
 * @modifiedBy - Peter Chung
 *            -- Applied different words to nameKeywordMap
 *            -- removed startTick
 *            -- Chagen outputs
 */
public final class TwitterSpout extends BaseRichSpout {

    private static final Logger LOGGER = LoggerFactory.getLogger(TwitterSpout.class);
    private static final long serialVersionUID = -1590819539847344427L;
    private SpoutOutputCollector _outputCollector;
    private LinkedBlockingQueue<Status> _queue;
    private TwitterStream _twitterStream;
    private SortedMap<String, String> nameKeywordMap = null;

    @Override
    public final void open(final Map conf, final TopologyContext context,
                           final SpoutOutputCollector collector) {

        this._queue = new LinkedBlockingQueue<>(1000);
        this._outputCollector = collector;

        final StatusListener statusListener = new StatusListener() {
            @Override
            public void onStatus(final Status status) {
                _queue.offer(status);
            }

            @Override
            public void onDeletionNotice(final StatusDeletionNotice sdn) {
            }

            @Override
            public void onTrackLimitationNotice(final int i) {
            }

            @Override
            public void onScrubGeo(final long l, final long l1) {
            }

            @Override
            public void onStallWarning(final StallWarning stallWarning) {
            }

            @Override
            public void onException(final Exception e) {
            }
        };


        //Twitter stream authentication setup
        final Properties properties = new Properties();
        try {
            properties.load(TwitterSpout.class.getClassLoader()
                    .getResourceAsStream(Constants.CONFIG_PROPERTIES_FILE));
        } catch (final IOException ioException) {
            LOGGER.error(ioException.getMessage(), ioException);
            System.exit(1);
        }

        final ConfigurationBuilder configurationBuilder = new ConfigurationBuilder();
        configurationBuilder.setIncludeEntitiesEnabled(true);
        configurationBuilder.setOAuthAccessToken(properties.getProperty(Constants.OAUTH_ACCESS_TOKEN));
        configurationBuilder.setOAuthAccessTokenSecret(properties.getProperty(Constants.OAUTH_ACCESS_TOKEN_SECRET));
        configurationBuilder.setOAuthConsumerKey(properties.getProperty(Constants.OAUTH_CONSUMER_KEY));
        configurationBuilder.setOAuthConsumerSecret(properties.getProperty(Constants.OAUTH_CONSUMER_SECRET));

        this._twitterStream = new TwitterStreamFactory(configurationBuilder.build()).getInstance();
        this._twitterStream.addListener(statusListener);

        final FilterQuery filterQuery = new FilterQuery();

        //Bounding Box for United States.
        final double[][] boundingBoxOfUS = {{-124.848974, 24.396308},{-66.885444, 49.384358}};

        //Spout will read the Name-Keyword file [which is in the classpath] and stores the key-value pairs to a Map.
        nameKeywordMap = Maps.newTreeMap();
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

        //LOGGER.info("{}", Arrays.toString(nameKeywordMap.keySet().toArray(new String[0])));
        filterQuery.locations(boundingBoxOfUS);
        //Peter
        filterQuery.track(nameKeywordMap.keySet().toArray(new String[0]));
        this._twitterStream.filter(filterQuery);

        // start the sampling of tweets
        //this._twitterStream.sample();
    }

    @Override
    public final void declareOutputFields(final OutputFieldsDeclarer outputFieldsDeclarer) {
        //outputFieldsDeclarer.declare(new Fields("startTick", "tweet"));
        outputFieldsDeclarer.declare(new Fields("tweet"));
    }

    @Override
    public final void nextTuple() {

        final Status status = _queue.poll();

        if (null == status) {
            Utils.sleep(500);
        } else {
        //    long startTick = System.nanoTime();
        //    //Emit the start time and the complete tweet to the next Bolt.
        //    this._outputCollector.emit(new Values(startTick, status));
            this._outputCollector.emit(new Values(status));
        }
    }

    @Override
    public final void close() {
        this._twitterStream.cleanUp();
        this._twitterStream.shutdown();
    }

    @Override
    public final void ack(final Object id) {
    }

    @Override
    public final void fail(final Object id) {
    }
}
