package ebaytool.apicall;

import com.mongodb.*;
import com.mongodb.util.*;
import ebaytool.apicall.ApiCall;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import javax.xml.parsers.*;
import javax.xml.transform.Source;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.*;
import javax.xml.XMLConstants;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;
import org.bson.types.ObjectId;
import org.w3c.dom.*;
import org.xml.sax.SAXException;

public class AddItems extends ApiCall {
	
	private String userid;
	private String site;
	private String chunkidx;
	private String[] itemids;
	private String requestxml;
	
	public AddItems() throws Exception {
	}
	
	/*
	public cnstAddItems (String userid, String site, String chunkidx, String[] itemids, 
					 String requestxml) {
		this.userid     = userid;
		this.site       = site;
		this.chunkidx   = chunkidx;
		this.itemids    = itemids;
		this.requestxml = requestxml;
	}
	*/
	
	public String call() throws Exception {
		
		String userid;
		String site;
		HashMap<String,String> tokenmap = getUserIdToken();
		
		DBCollection coll = db.getCollection("items");
		
		BasicDBObject query = new BasicDBObject();
		query.put("ext.labels.deleted", new BasicDBObject("$exists", 0));
		query.put("ext.status", "(re)list");
		query.put("ItemID", new BasicDBObject("$exists", 0));
		
		
		BasicDBObject update = new BasicDBObject();
		update.put("$set", new BasicDBObject("ext.status", "(re)listing"));
		
		WriteResult result = coll.update(query, update, false, true);
		System.out.println("WriteResult: "+result);
		
		query.put("ext.status", "(re)listing");
		
		LinkedHashMap<String,LinkedHashMap> lhm = new LinkedHashMap<String,LinkedHashMap>();
		DBCursor cur = coll.find(query).limit(10);
		while (cur.hasNext()) {
			DBObject item = cur.next();
			
			userid = ((BasicDBObject) item.get("ext")).get("UserID").toString();
			site   = item.get("Site").toString();
			
			/* todo: remove more fields */
			item.put("ConditionID", 1000);
			item.put("ListingDuration", "Days_3");
			//item.removeField("_id"); // if delete here, can't mapping result data.
			item.removeField("BuyerProtection");
			item.removeField("SellingStatus");
			item.removeField("ext");
			((BasicDBObject) item.get("ShippingDetails")).removeField("SalesTax");
			
			if (!lhm.containsKey(userid)) {
				lhm.put(userid, new LinkedHashMap<String,LinkedHashMap>());
			}
			
			if (!lhm.get(userid).containsKey(site)) {
				((LinkedHashMap) lhm.get(userid)).put(site, new LinkedHashMap<Integer,ArrayList>());
				((LinkedHashMap) lhm.get(userid).get(site)).put(0, new ArrayList<DBObject>());
			}
			
			int curidx = ((LinkedHashMap) lhm.get(userid).get(site)).size();
			int size = ((List) ((LinkedHashMap) lhm.get(userid).get(site)).get(curidx-1)).size();
			if (size >= 5) {
				((LinkedHashMap) lhm.get(userid).get(site)).put(curidx,
																new ArrayList<DBObject>());
				curidx = ((LinkedHashMap) lhm.get(userid).get(site)).size();
			}
			
			// add item data to each userid.site.chunk array.
			((List) ((LinkedHashMap) lhm.get(userid).get(site)).get(curidx-1)).add(item);
		}		
		
		// each userid
		for (String tmpuserid : lhm.keySet()) {
			LinkedHashMap lhmuserid = lhm.get(tmpuserid);
			
			// each site
			for (Object tmpsite : lhmuserid.keySet()) {
				LinkedHashMap lhmsite = (LinkedHashMap) lhmuserid.get(tmpsite);
				
				// each chunk
				for (Object tmpchunk : lhmsite.keySet()) {
					List litems = (List) lhmsite.get(tmpchunk);
					
					BasicDBObject requestdbo = new BasicDBObject();
					requestdbo.append("WarningLevel", "High");
					requestdbo.append("RequesterCredentials",
									  new BasicDBObject("eBayAuthToken", tokenmap.get(tmpuserid)));
					
					String[] itemids = new String[5];
					int messageid = 0;
					List<DBObject> ldbo = new ArrayList<DBObject>();
					for (Object tmpidx : litems) {
						
						itemids[messageid] = ((BasicDBObject) tmpidx).get("_id").toString();
						String id = ((BasicDBObject) tmpidx).get("_id").toString();
						System.out.println(tmpuserid
										   +"."+tmpsite
										   +"."+tmpchunk
										   +"."+messageid
										   +":"+itemids[messageid]);
						
						((BasicDBObject) tmpidx).removeField("_id"); // remove _id here, not before.
						
						ldbo.add(new BasicDBObject("MessageID", id).append("Item", tmpidx));
						
						String title = ((BasicDBObject) tmpidx).get("Title").toString();
					}
					
					requestdbo.append("AddItemRequestContainer", ldbo);
					
					JSONObject jso = JSONObject.fromObject(requestdbo.toString());
					JSONArray tmpitems = jso.getJSONArray("AddItemRequestContainer");
					for (Object tmpitem : tmpitems) {
						JSONObject tmpi = ((JSONObject) tmpitem).getJSONObject("Item");
						
						/* expand array elements */
						if (tmpi.has("PaymentAllowedSite") && tmpi.get("PaymentAllowedSite")
							.getClass().toString().equals("class net.sf.json.JSONArray")) {
							tmpi.getJSONArray("PaymentAllowedSite").setExpandElements(true);
						}
						
						if (tmpi.has("PaymentMethods") && tmpi.get("PaymentMethods")
							.getClass().toString().equals("class net.sf.json.JSONArray")) {
							tmpi.getJSONArray("PaymentMethods").setExpandElements(true);
						}
						
						if (((JSONObject) tmpi.get("PictureDetails")).has("PictureURL")
							&& ((JSONObject) tmpi.get("PictureDetails")).get("PictureURL")
							.getClass().toString().equals("class net.sf.json.JSONArray")) {
							((JSONObject) tmpi.get("PictureDetails"))
								.getJSONArray("PictureURL").setExpandElements(true);
						}
					}			
					jso.getJSONArray("AddItemRequestContainer").setExpandElements(true);
					
					XMLSerializer xmls = new XMLSerializer();
					xmls.setObjectName("AddItemsRequest");
					xmls.setNamespace(null, "urn:ebay:apis:eBLBaseComponents");
					xmls.setTypeHintsEnabled(false);
					String requestxml = xmls.write(jso);
					
					writelog("AIs.req"
							 +"."+((String) tmpuserid)
							 +"."+((String) tmpsite)
							 +"."+new Integer(Integer.parseInt(tmpchunk.toString())).toString()
							 +".req.xml", requestxml);
					
					ecs18.submit(new ApiCallTask(0, requestxml, "AddItems"));
					
				}
			}
		}
		
		// each userid
		for (String tmpuserid : lhm.keySet()) {
			LinkedHashMap lhmuserid = lhm.get(tmpuserid);
			
			// each site
			for (Object tmpsite : lhmuserid.keySet()) {
				LinkedHashMap lhmsite = (LinkedHashMap) lhmuserid.get(tmpsite);
				
				// each chunk
				for (Object tmpchunk : lhmsite.keySet()) {
					List litems = (List) lhmsite.get(tmpchunk);
					
					String responsexml = ecs18.take().get();
					parseresponse(responsexml);
					
					writelog("AIs.req"
							 +"."+((String) tmpuserid)
							 +"."+((String) tmpsite)
							 +"."+new Integer(Integer.parseInt(tmpchunk.toString())).toString()
							 +".res.xml", responsexml);
				}
			}
		}
		
		return "OK";
	}
	
	public BasicDBObject parseresponse(String responsexml) throws Exception {
		
		BasicDBObject responsedbo = convertXML2DBObject(responsexml);
		
		System.out.println(responsedbo.get("Ack").toString());
		
		DBCollection coll = db.getCollection("items");
		
		BasicDBList dbl = (BasicDBList) responsedbo.get("AddItemResponseContainer");
		for (Object item : dbl) {
			
			String id        = ((BasicDBObject) item).getString("CorrelationID");
			String itemid    = ((BasicDBObject) item).getString("ItemID");
			String starttime = ((BasicDBObject) item).getString("StartTime");
			String endtime   = ((BasicDBObject) item).getString("EndTime");
			
			BasicDBObject upditem = new BasicDBObject();
			upditem.put("ItemID", itemid);
			upditem.put("ListingDetails.StartTime", starttime);
			upditem.put("ListingDetails.EndTime", endtime);
			upditem.put("ext.status", "");
			
			BasicDBObject query = new BasicDBObject();
			query.put("_id", new ObjectId(id));
			
			BasicDBObject update = new BasicDBObject();
			update.put("$set", upditem);
			
			WriteResult result = coll.update(query, update);
			System.out.println(id+" : "+itemid+" : "+result);
			
		}
		
		return responsedbo;
	}
	
	private HashMap<String,String> getUserIdToken() throws Exception {
		
		HashMap<String,String> hm = new HashMap<String,String>();
		
		DBCursor cur = db.getCollection("users").find();
		while (cur.hasNext()) {
			DBObject user = cur.next();
			BasicDBObject userids = (BasicDBObject) user.get("userids");
			
			for (Object userid : userids.keySet()) {
				
				String ebaytkn = 
					((BasicDBObject) userids.get(userid.toString())).get("ebaytkn").toString();
				
				hm.put(userid.toString(), ebaytkn);
			}
			
		}
		
		return hm;
	}
	
	/* XML Validation */
	private void validatexml(String filename) throws Exception {
		
		// todo: why Country error occures?
		DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
		dbf.setNamespaceAware(true);
		DocumentBuilder parser = dbf.newDocumentBuilder();
		Document document = parser.parse(new File("/var/www/ebaytool/logs/apixml/"+filename));
		
		SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
		
		Source schemaFile = new StreamSource(new File("/var/www/ebaytool/data/ebaySvc.xsd"));
		Schema schema = factory.newSchema(schemaFile);
		
		Validator validator = schema.newValidator();
		
		try {
			validator.validate(new DOMSource(document));
		} catch (SAXException e) {
			System.out.println(e.toString());
		}
		
	}
	
}