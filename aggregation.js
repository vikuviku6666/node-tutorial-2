require('dotenv').config();

const { MongoClient } = require('mongodb');

async function main() {
	/**
	 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
	 * See https://docs.mongodb.com/drivers/node/ for more details
	 */
	const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jjmb1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

	/**
	 * The Mongo Client you will use to interact with your database
	 * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
	 * In case: '[MONGODB DRIVER] Warning: Current Server Discovery and Monitoring engine is deprecated...'
	 * pass option { useUnifiedTopology: true } to the MongoClient constructor.
	 * const client =  new MongoClient(uri, {useUnifiedTopology: true})
	 */
	const client = new MongoClient(url);

	try {
		// Connect to the MongoDB cluster
    await client.connect();
    await printCheapestSuburbs(client, 'Australia', 'Sydney', 10);

		// Make the appropriate DB calls
	} finally {
		// Close the connection to the MongoDB cluster
		await client.close();
	}
}

main().catch(console.error);

// Add functions that make DB calls here

async function printCheapestSuburbs(clint, country, market, maxNumberToPrint) {

  const pipeline = [
    {
      $match: {
        bedrooms: 1,
        'address.country': country,
        'address.market': market,
        'address.suburb': {
          $exists: 1,
          $ne: '',
        },
        room_type: 'Entire home/apt',
      },
    },
    {
      $group: {
        _id: '$address.suburb',
        averagePrice: {
          $avg: '$price',
        },
      },
    },
    {
      $sort: {
        averagePrice: 1,
      },
    },
    {
      $limit: maxNumberToPrint,
    },
  ];
  const aggCursor = clint.db('sample_airbnb').collection('listingsAndReviews').aggregate(pipeline);
 
  await aggCursor.forEach(airbnbListing => {
    console.log(`${airbnbListing._id}: ${airbnbListing.averagePrice}`);
  })
}


