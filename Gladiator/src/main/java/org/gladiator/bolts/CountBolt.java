package org.gladiator.bolts;

import backtype.storm.Config;
import backtype.storm.LocalCluster;
import backtype.storm.StormSubmitter;
import backtype.storm.spout.SpoutOutputCollector;
import backtype.storm.task.OutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.testing.TestWordSpout;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.topology.TopologyBuilder;
import backtype.storm.topology.base.BaseRichSpout;
import backtype.storm.topology.base.BaseRichBolt;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Tuple;
import backtype.storm.tuple.Values;
import backtype.storm.utils.Utils;

import java.util.HashMap;
import java.util.Map;

import org.gladiator.utils.Constants;


/**
 * @author - Peter Chung
 * Count keyword using map, then include the count to emit
 */
public class CountBolt extends BaseRichBolt
{
  // To output tuples from this bolt to the next stage bolts, if any
  private OutputCollector collector;

  private Map<String, Integer> countMapAL;
  private Map<String, Integer> countMapAK;
  private Map<String, Integer> countMapAR;
  private Map<String, Integer> countMapAZ;
  private Map<String, Integer> countMapCA;
  private Map<String, Integer> countMapCO;
  private Map<String, Integer> countMapCT;
  private Map<String, Integer> countMapDE;
  private Map<String, Integer> countMapDC;
  private Map<String, Integer> countMapFL;
  private Map<String, Integer> countMapGA;
  private Map<String, Integer> countMapHI;
  private Map<String, Integer> countMapID;
  private Map<String, Integer> countMapIL;
  private Map<String, Integer> countMapIN;
  private Map<String, Integer> countMapIA;
  private Map<String, Integer> countMapKS;
  private Map<String, Integer> countMapKY;
  private Map<String, Integer> countMapLA;
  private Map<String, Integer> countMapME;
  private Map<String, Integer> countMapMT;
  private Map<String, Integer> countMapNE;
  private Map<String, Integer> countMapNV;
  private Map<String, Integer> countMapNH;
  private Map<String, Integer> countMapNJ;
  private Map<String, Integer> countMapNM;
  private Map<String, Integer> countMapNY;
  private Map<String, Integer> countMapNC;
  private Map<String, Integer> countMapND;
  private Map<String, Integer> countMapOH;
  private Map<String, Integer> countMapOK;
  private Map<String, Integer> countMapOR;
  private Map<String, Integer> countMapMD;
  private Map<String, Integer> countMapMA;
  private Map<String, Integer> countMapMI;
  private Map<String, Integer> countMapMN;
  private Map<String, Integer> countMapMS;
  private Map<String, Integer> countMapMO;
  private Map<String, Integer> countMapPA;
  private Map<String, Integer> countMapRI;
  private Map<String, Integer> countMapSC;
  private Map<String, Integer> countMapSD;
  private Map<String, Integer> countMapTN;
  private Map<String, Integer> countMapTX;
  private Map<String, Integer> countMapUT;
  private Map<String, Integer> countMapVT;
  private Map<String, Integer> countMapVA;
  private Map<String, Integer> countMapWA;
  private Map<String, Integer> countMapWV;
  private Map<String, Integer> countMapWI;
  private Map<String, Integer> countMapWY;


  @Override
  public void prepare(
      Map                     map,
      TopologyContext         topologyContext,
      OutputCollector         outputCollector)
  {

    // save the collector for emitting tuples
    collector = outputCollector;

    // create and initialize the map
    countMapAL = new HashMap<String, Integer>();
    countMapAK = new HashMap<String, Integer>();
    countMapAR = new HashMap<String, Integer>();
    countMapAZ = new HashMap<String, Integer>();
    countMapCA = new HashMap<String, Integer>();
    countMapCO = new HashMap<String, Integer>();
    countMapCT = new HashMap<String, Integer>();
    countMapDE = new HashMap<String, Integer>();
    countMapDC = new HashMap<String, Integer>();
    countMapFL = new HashMap<String, Integer>();
    countMapGA = new HashMap<String, Integer>();
    countMapHI = new HashMap<String, Integer>();
    countMapID = new HashMap<String, Integer>();
    countMapIL = new HashMap<String, Integer>();
    countMapIN = new HashMap<String, Integer>();
    countMapIA = new HashMap<String, Integer>();
    countMapKS = new HashMap<String, Integer>();
    countMapKY = new HashMap<String, Integer>();
    countMapLA = new HashMap<String, Integer>();
    countMapME = new HashMap<String, Integer>();
    countMapMT = new HashMap<String, Integer>();
    countMapNE = new HashMap<String, Integer>();
    countMapNV = new HashMap<String, Integer>();
    countMapNH = new HashMap<String, Integer>();
    countMapNJ = new HashMap<String, Integer>();
    countMapNM = new HashMap<String, Integer>();
    countMapNY = new HashMap<String, Integer>();
    countMapNC = new HashMap<String, Integer>();
    countMapND = new HashMap<String, Integer>();
    countMapOH = new HashMap<String, Integer>();
    countMapOK = new HashMap<String, Integer>();
    countMapOR = new HashMap<String, Integer>();
    countMapMD = new HashMap<String, Integer>();
    countMapMA = new HashMap<String, Integer>();
    countMapMI = new HashMap<String, Integer>();
    countMapMN = new HashMap<String, Integer>();
    countMapMS = new HashMap<String, Integer>();
    countMapMO = new HashMap<String, Integer>();
    countMapPA = new HashMap<String, Integer>();
    countMapRI = new HashMap<String, Integer>();
    countMapSC = new HashMap<String, Integer>();
    countMapSD = new HashMap<String, Integer>();
    countMapTN = new HashMap<String, Integer>();
    countMapTX = new HashMap<String, Integer>();
    countMapUT = new HashMap<String, Integer>();
    countMapVT = new HashMap<String, Integer>();
    countMapVA = new HashMap<String, Integer>();
    countMapWA = new HashMap<String, Integer>();
    countMapWV = new HashMap<String, Integer>();
    countMapWI = new HashMap<String, Integer>();
    countMapWY = new HashMap<String, Integer>();

  }

  @Override
  public void execute(Tuple tuple)
  {
    final String tweet = tuple.getStringByField("tweetText");
    final String state = tuple.getStringByField("state");
    final String keyword = tuple.getStringByField("keyWord");
    Integer count=0, val=0;

    switch (state) {
      case "AL":
      // check if the word is present in the map
        if (countMapAL.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapAL.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapAL.get(keyword);
          // increment the count and save it to the map
          countMapAL.put(keyword, ++val);
        }
        count = countMapAL.get(keyword);
      break;
      case "AK":
      // check if the word is present in the map
        if (countMapAK.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapAK.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapAK.get(keyword);
          // increment the count and save it to the map
          countMapAK.put(keyword, ++val);
        }
        count = countMapAK.get(keyword);

      break;
      case "AZ":
      // check if the word is present in the map
        if (countMapAZ.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapAZ.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapAZ.get(keyword);
          // increment the count and save it to the map
          countMapAZ.put(keyword, ++val);
        }
        count = countMapAZ.get(keyword);
      break;
      case "AR":
      // check if the word is present in the map
        if (countMapAR.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapAR.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapAR.get(keyword);
          // increment the count and save it to the map
          countMapAR.put(keyword, ++val);
        }
        count = countMapAR.get(keyword);
      break;
      case "CA":
      // check if the word is present in the map
        if (countMapCA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapCA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapCA.get(keyword);
          // increment the count and save it to the map
          countMapCA.put(keyword, ++val);
        }
        count = countMapCA.get(keyword);
      break;
      case "CO":
      // check if the word is present in the map
        if (countMapCO.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapCO.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapCO.get(keyword);
          // increment the count and save it to the map
          countMapCO.put(keyword, ++val);
        }
        count = countMapCO.get(keyword);
      break;
      case "CT":
      // check if the word is present in the map
        if (countMapCT.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapCT.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapCT.get(keyword);
          // increment the count and save it to the map
          countMapCT.put(keyword, ++val);
        }
        count = countMapCT.get(keyword);
      break;
      case "DE":
      // check if the word is present in the map
        if (countMapDE.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapDE.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapDE.get(keyword);
          // increment the count and save it to the map
          countMapDE.put(keyword, ++val);
        }
        count = countMapDE.get(keyword);
      break;
      case "DC":
      // check if the word is present in the map
        if (countMapDC.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapDC.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapDC.get(keyword);
          // increment the count and save it to the map
          countMapDC.put(keyword, ++val);
        }
        count = countMapDC.get(keyword);
      break;
      case "FL":
      // check if the word is present in the map
        if (countMapFL.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapFL.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapFL.get(keyword);
          // increment the count and save it to the map
          countMapFL.put(keyword, ++val);
        }
        count = countMapFL.get(keyword);
      break;
      case "GA":
      // check if the word is present in the map
        if (countMapGA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapGA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapGA.get(keyword);
          // increment the count and save it to the map
          countMapGA.put(keyword, ++val);
        }
        count = countMapGA.get(keyword);
      break;
      case "HI":
      // check if the word is present in the map
        if (countMapHI.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapHI.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapHI.get(keyword);
          // increment the count and save it to the map
          countMapHI.put(keyword, ++val);
        }
        count = countMapHI.get(keyword);
      break;
      case "ID":
      // check if the word is present in the map
        if (countMapID.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapID.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapID.get(keyword);
          // increment the count and save it to the map
          countMapID.put(keyword, ++val);
        }
        count = countMapID.get(keyword);
      break;
      case "IL":
      // check if the word is present in the map
        if (countMapIL.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapIL.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapIL.get(keyword);
          // increment the count and save it to the map
          countMapIL.put(keyword, ++val);
        }
        count = countMapIL.get(keyword);
      break;
      case "IN":
      // check if the word is present in the map
        if (countMapIN.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapIN.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapIN.get(keyword);
          // increment the count and save it to the map
          countMapIN.put(keyword, ++val);
        }
        count = countMapIN.get(keyword);
      break;
      case "IA":
      // check if the word is present in the map
        if (countMapIA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapIA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapIA.get(keyword);
          // increment the count and save it to the map
          countMapIA.put(keyword, ++val);
        }
        count = countMapIA.get(keyword);
      break;
      case "KS":
      // check if the word is present in the map
        if (countMapKS.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapKS.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapKS.get(keyword);
          // increment the count and save it to the map
          countMapKS.put(keyword, ++val);
        }
        count = countMapKS.get(keyword);
      break;
      case "KY":
      // check if the word is present in the map
        if (countMapKY.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapKY.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapKY.get(keyword);
          // increment the count and save it to the map
          countMapKY.put(keyword, ++val);
        }
        count = countMapKY.get(keyword);
      break;
      case "LA":
      // check if the word is present in the map
        if (countMapLA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapLA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapLA.get(keyword);
          // increment the count and save it to the map
          countMapLA.put(keyword, ++val);
        }
        count = countMapLA.get(keyword);
      break;
      case "ME":
      // check if the word is present in the map
        if (countMapME.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapME.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapME.get(keyword);
          // increment the count and save it to the map
          countMapME.put(keyword, ++val);
        }
        count = countMapME.get(keyword);
      break;
      case "MT":
      // check if the word is present in the map
        if (countMapMT.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapMT.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapMT.get(keyword);
          // increment the count and save it to the map
          countMapMT.put(keyword, ++val);
        }
        count = countMapMT.get(keyword);
      break;
      case "NE":
      // check if the word is present in the map
        if (countMapNE.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapNE.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapNE.get(keyword);
          // increment the count and save it to the map
          countMapNE.put(keyword, ++val);
        }
        count = countMapNE.get(keyword);
      break;
      case "NV":
      // check if the word is present in the map
        if (countMapNV.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapNV.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapNV.get(keyword);
          // increment the count and save it to the map
          countMapNV.put(keyword, ++val);
        }
        count = countMapNV.get(keyword);
      break;
      case "NH":
      // check if the word is present in the map
        if (countMapNH.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapNH.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapNH.get(keyword);
          // increment the count and save it to the map
          countMapNH.put(keyword, ++val);
        }
        count = countMapNH.get(keyword);
      break;
      case "NJ":
      // check if the word is present in the map
        if (countMapNJ.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapNJ.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapNJ.get(keyword);
          // increment the count and save it to the map
          countMapNJ.put(keyword, ++val);
        }
        count = countMapNJ.get(keyword);
      break;
      case "NM":
      // check if the word is present in the map
        if (countMapNM.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapNM.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapNM.get(keyword);
          // increment the count and save it to the map
          countMapNM.put(keyword, ++val);
        }
        count = countMapNM.get(keyword);
      break;
      case "NY":
      // check if the word is present in the map
        if (countMapNY.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapNY.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapNY.get(keyword);
          // increment the count and save it to the map
          countMapNY.put(keyword, ++val);
        }
        count = countMapNY.get(keyword);
      break;
      case "NC":
      // check if the word is present in the map
        if (countMapNC.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapNC.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapNC.get(keyword);
          // increment the count and save it to the map
          countMapNC.put(keyword, ++val);
        }
        count = countMapNC.get(keyword);
      break;
      case "ND":
      // check if the word is present in the map
        if (countMapND.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapND.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapND.get(keyword);
          // increment the count and save it to the map
          countMapND.put(keyword, ++val);
        }
        count = countMapND.get(keyword);
      break;
      case "OH":
      // check if the word is present in the map
        if (countMapOH.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapOH.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapOH.get(keyword);
          // increment the count and save it to the map
          countMapOH.put(keyword, ++val);
        }
        count = countMapOH.get(keyword);
      break;
      case "OK":
      // check if the word is present in the map
        if (countMapOK.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapOK.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapOK.get(keyword);
          // increment the count and save it to the map
          countMapOK.put(keyword, ++val);
        }
        count = countMapOK.get(keyword);
      break;
      case "OR":
      // check if the word is present in the map
        if (countMapOR.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapOR.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapOR.get(keyword);
          // increment the count and save it to the map
          countMapOR.put(keyword, ++val);
        }
        count = countMapOR.get(keyword);
      break;
      case "MD":
      // check if the word is present in the map
        if (countMapMD.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapMD.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapMD.get(keyword);
          // increment the count and save it to the map
          countMapMD.put(keyword, ++val);
        }
        count = countMapMD.get(keyword);
      break;
      case "MA":
      // check if the word is present in the map
        if (countMapMA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapMA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapMA.get(keyword);
          // increment the count and save it to the map
          countMapMA.put(keyword, ++val);
        }
        count = countMapMA.get(keyword);
      break;
      case "MI":
      // check if the word is present in the map
        if (countMapMI.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapMI.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapMI.get(keyword);
          // increment the count and save it to the map
          countMapMI.put(keyword, ++val);
        }
        count = countMapMI.get(keyword);
      break;
      case "MN":
      // check if the word is present in the map
        if (countMapMN.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapMN.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapMN.get(keyword);
          // increment the count and save it to the map
          countMapMN.put(keyword, ++val);
        }
        count = countMapMN.get(keyword);
      break;
      case "MS":
      // check if the word is present in the map
        if (countMapMS.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapMS.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapMS.get(keyword);
          // increment the count and save it to the map
          countMapMS.put(keyword, ++val);
        }
        count = countMapMS.get(keyword);
      break;
      case "MO":
      // check if the word is present in the map
        if (countMapMO.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapMO.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapMO.get(keyword);
          // increment the count and save it to the map
          countMapMO.put(keyword, ++val);
        }
        count = countMapMO.get(keyword);
      break;
      case "PA":
      // check if the word is present in the map
        if (countMapPA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapPA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapPA.get(keyword);
          // increment the count and save it to the map
          countMapPA.put(keyword, ++val);
        }
        count = countMapPA.get(keyword);
      break;
      case "RI":
      // check if the word is present in the map
        if (countMapRI.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapRI.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapRI.get(keyword);
          // increment the count and save it to the map
          countMapRI.put(keyword, ++val);
        }
        count = countMapRI.get(keyword);
      break;
      case "SC":
      // check if the word is present in the map
        if (countMapSC.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapSC.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapSC.get(keyword);
          // increment the count and save it to the map
          countMapSC.put(keyword, ++val);
        }
        count = countMapSC.get(keyword);
      break;
      case "SD":
      // check if the word is present in the map
        if (countMapSD.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapSD.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapSD.get(keyword);
          // increment the count and save it to the map
          countMapSD.put(keyword, ++val);
        }
        count = countMapSD.get(keyword);
      break;
      case "TN":
      // check if the word is present in the map
        if (countMapTN.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapTN.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapTN.get(keyword);
          // increment the count and save it to the map
          countMapTN.put(keyword, ++val);
        }
        count = countMapTN.get(keyword);
      break;
      case "TX":
      // check if the word is present in the map
        if (countMapTX.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapTX.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapTX.get(keyword);
          // increment the count and save it to the map
          countMapTX.put(keyword, ++val);
        }
        count = countMapTX.get(keyword);
      break;
      case "UT":
      // check if the word is present in the map
        if (countMapUT.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapUT.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapUT.get(keyword);
          // increment the count and save it to the map
          countMapUT.put(keyword, ++val);
        }
        count = countMapUT.get(keyword);
      break;
      case "VT":
      // check if the word is present in the map
        if (countMapVT.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapVT.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapVT.get(keyword);
          // increment the count and save it to the map
          countMapVT.put(keyword, ++val);
        }
        count = countMapVT.get(keyword);
      break;
      case "VA":
      // check if the word is present in the map
        if (countMapVA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapVA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapVA.get(keyword);
          // increment the count and save it to the map
          countMapVA.put(keyword, ++val);
        }
        count = countMapVA.get(keyword);
      break;
      case "WA":
      // check if the word is present in the map
        if (countMapWA.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapWA.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapWA.get(keyword);
          // increment the count and save it to the map
          countMapWA.put(keyword, ++val);
        }
        count = countMapWA.get(keyword);
      break;
      case "WV":
      // check if the word is present in the map
        if (countMapWV.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapWV.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapWV.get(keyword);
          // increment the count and save it to the map
          countMapWV.put(keyword, ++val);
        }
        count = countMapWV.get(keyword);
      break;
      case "WI":
      // check if the word is present in the map
        if (countMapWI.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapWI.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapWI.get(keyword);
          // increment the count and save it to the map
          countMapWI.put(keyword, ++val);
        }
        count = countMapWI.get(keyword);
      break;
      case "WY":
      // check if the word is present in the map
        if (countMapWY.get(keyword) == null) {
          // not present, add the word with a count of 1
          countMapWY.put(keyword, 1);
        } else {
          // already there, hence get the count
          val = countMapWY.get(keyword);
          // increment the count and save it to the map
          countMapWY.put(keyword, ++val);
        }
        count = countMapWY.get(keyword);
      break;
      default:
        return;

    }
    // emit count, keyword, tweettest, and location
    collector.emit(new Values(count, keyword, tweet, state));

/*
    // check if the word is present in the map
    if (countMap.get(keyword) == null) {

      // not present, add the word with a count of 1
      countMap.put(keyword, 1);
    } else {

      // already there, hence get the count
      Integer val = countMap.get(keyword);

      // increment the count and save it to the map
      countMap.put(keyword, ++val);
    }

    // emit count, keyword, tweettest, and location
    collector.emit(new Values(countMap.get(keyword), keyword, tweet, state));
  */
  }

  @Override
  public void declareOutputFields(OutputFieldsDeclarer outputFieldsDeclarer)
  {
    // tell storm the schema of the output tuple for this spout

    // declare the first column 'word', second column 'count'
    outputFieldsDeclarer.declare(new Fields("count","keyword", "tweetText","state"));
  }
}
