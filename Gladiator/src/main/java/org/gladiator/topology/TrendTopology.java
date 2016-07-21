package org.gladiator.topology;

import backtype.storm.Config;
import backtype.storm.LocalCluster;
import backtype.storm.StormSubmitter;
import backtype.storm.contrib.jms.JmsProvider;
import backtype.storm.contrib.jms.bolt.JmsBolt;
import backtype.storm.topology.TopologyBuilder;
import backtype.storm.tuple.Fields;
import backtype.storm.utils.Utils;
import com.google.gson.Gson;
import org.gladiator.bolts.KeyWordFinderBolt;
import org.gladiator.bolts.CountBolt;
import org.gladiator.jms.SpringJmsProvider;
import org.gladiator.models.TopologyOutput;
import org.gladiator.utils.Constants;
import org.json.simple.JSONObject;

import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.xbean.spring.context.ClassPathXmlApplicationContext;
import org.gladiator.bolts.StateLocatorBolt;
import org.gladiator.spouts.TwitterSpout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import redis.clients.jedis.Jedis;

/**
 * Topology to organize spouts and bolts for gladiator
 *
 * @author - Udacity, Abdullah Moyeen
 * @modifiedBy - Peter Chung
 *             -- apply new topology
 *             -- apply new output format
 * (Code reused from TopNTweetToplogy by Udacitywith the addition of bolts and use of Gson and TopologyOutput classes for Json Serialization)
 */
public final class TrendTopology {

    private static final Logger LOGGER = LoggerFactory.getLogger(TrendTopology.class);

    public static final void main(final String[] args) throws Exception {

        final ApplicationContext applicationContext = new ClassPathXmlApplicationContext("applicationContext.xml");
        final JmsProvider jmsProvider = new SpringJmsProvider(applicationContext, "jmsConnectionFactory", "notificationQueue");
        final TopologyBuilder topologyBuilder = new TopologyBuilder();
        final JmsBolt jmsBolt = new JmsBolt();


        jmsBolt.setJmsProvider(jmsProvider);
        jmsBolt.setJmsMessageProducer((session, input) -> {
            //final Long endTick = System.nanoTime();
            //final TopologyOutput topologyOutput = new TopologyOutput(input.getLong(0), input.getString(1), input.getInteger(2), input.getString(3), input.getString(4), endTick, Math.abs((endTick-input.getLong(0))/1000000));
            final TopologyOutput topologyOutput = new TopologyOutput(input.getInteger(0), input.getString(1), input.getString(2), input.getString(3));
            String scode=topologyOutput.getStateCode();
            Integer scount=topologyOutput.getCount();
            String kword=topologyOutput.getKeyWord();
         
            Jedis jedis = new Jedis("127.0.0.1");
         
            LocalDateTime currentTime = LocalDateTime.now();
    		//int month = currentTime.getMonthValue();
    		int day = currentTime.getDayOfMonth();
    		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM");
			String month = currentTime.format(formatter);
    		String time = currentTime.getYear()+"-"+ month + "-" + day;

    		settingData(kword, scount, time, jedis);

    		
    		System.out.println("Getting keyword : "+ kword);
    		
    		Map<String, String> myMap = jedis.hgetAll(kword);
    		//Map<String, String> myMap = new HashMap();
    		//myMap.put("2016-07-14", "3");
    		//myMap.put("2016-07-15", "8");
    		//myMap.put("2016-07-16", "10");
    		
    		/*Iterator it = myMap.entrySet().iterator();
    		while (it.hasNext()) {
    		    Map.Entry pairs = (Map.Entry)it.next();
    		    System.out.println("Data from db: "+pairs.getValue());
    		}*/

    		String gameData = makedata(myMap, kword);
    		
    		System.out.println("Data I am sedning ="+ gameData);
   	     
            Gson gson = new Gson();
            String topologyOutputJson = gson.toJson(topologyOutput);
            LOGGER.info("{}", topologyOutputJson);
            return session.createTextMessage(topologyOutputJson+"::"+gameData);
        });

        try {
            final Config config = new Config();
            config.setMessageTimeoutSecs(120);
            config.setDebug(true);

            topologyBuilder.setSpout("twitterspout", new TwitterSpout());
            topologyBuilder.setBolt("statelocatorbolt", new StateLocatorBolt()).shuffleGrouping("twitterspout");
            //topologyBuilder.setBolt("sentimentcalculatorbolt", new SentimentCalculatorBolt()).fieldsGrouping("statelocatorbolt", new Fields("state"));
            //topologyBuilder.setBolt("CandidateFinderBolt", new CandidateFinderBolt()).fieldsGrouping("statelocatorbolt", new Fields("state"));
            topologyBuilder.setBolt("KeyWordFinderBolt", new KeyWordFinderBolt()).fieldsGrouping("statelocatorbolt", new Fields("state"));
            topologyBuilder.setBolt("CountBolt", new CountBolt()).fieldsGrouping("KeyWordFinderBolt", new Fields("state"));
            topologyBuilder.setBolt("jmsBolt", jmsBolt).fieldsGrouping("CountBolt", new Fields("state"));

            //Submit to the cluster, or submit locally
            if (null != args && 0 < args.length) {
                config.setNumWorkers(3);
                StormSubmitter.submitTopology(args[0], config, topologyBuilder.createTopology());
            } else {
                config.setMaxTaskParallelism(3);
                final LocalCluster localCluster = new LocalCluster();
                localCluster.submitTopology(Constants.TOPOLOGY_NAME, config, topologyBuilder.createTopology());
                //Run this topology for 600 seconds so that we can complete processing of decent # of tweets.
                Utils.sleep(600 * 1000);

                LOGGER.info("Shutting down the cluster...");
                localCluster.killTopology(Constants.TOPOLOGY_NAME);
                localCluster.shutdown();

                Runtime.getRuntime().addShutdownHook(new Thread() {
                    @Override
                    public void run() {
                        LOGGER.info("Shutting down the cluster...");
                        localCluster.killTopology(Constants.TOPOLOGY_NAME);
                        localCluster.shutdown();
                    }
                });
            }
        } catch (final Exception exception) {
            exception.printStackTrace();
        }
    }
    
    private static void settingData(String keyword, Integer count, String time, Jedis jds) {

		Map<String, String> myMap = jds.hgetAll(keyword);
		String currentCount = myMap.get(time);
		if (currentCount == null || "".equals(currentCount)) {
			currentCount = "0";
		}
		Integer counter = Integer.valueOf(currentCount);
		//counter += (count == null ? 0 : count);
		counter += 1;
		myMap.put(time, counter.toString());
		jds.hmset(keyword, myMap);
	}
    
    private static String makedata(Map<String,String> inputMap, String keyword){
		List<Map<String, String>> list = new ArrayList<Map<String, String>>();
		Iterator it = inputMap.entrySet().iterator();
		while (it.hasNext()) {
		    Map.Entry pairs = (Map.Entry)it.next();
		    Map<String, String> tempMP = new HashMap<String, String>();
		    tempMP.put("date", pairs.getKey().toString());
		    tempMP.put("total", pairs.getValue().toString());
		    list.add(tempMP);
		}
		Map<String, List<Map<String, String>>> map = new HashMap<String, List<Map<String, String>>>();
	    map.put(keyword, list);
	      
		String outputMap = new Gson().toJson(map);
		
		System.out.println(new Gson().toJson(map));
		
		return outputMap;
	}
}
