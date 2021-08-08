const { MongoClient } = require('mongodb');

async function main() {
	const url = "mongodb+srv://vin6666:node123@cluster0.jjmb1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
	const client = new MongoClient(url);
try {
	await client.connect();

	await deleteListingsScrapedBeforeDate(client, new Date("2019-02-15"));

	//await deleteListingByName(client, "Cozy Cottage");

	//await updateAllListingsToHavePropertyType(client);

	//await upsertListingByName(client, "Cozy Cottage", { name: "Cozy Cottage", bedrooms: 2, bathrooms: 2, price: 20000, reviews: [{ rating: 5, review: "I love this place" }] });

/* 	await updateListingsByName(client, "Lovely Loft", {	bedrooms: 6, beds: 8}); */

/* 	await findListingsWithMinimumBedroomsAndBathroomsAndMostRecentReviews(client, {
		minimumNumberOfBedrooms: 2,
		minimumNumberOfBathrooms: 2,
		maximumNumberOfResults: 5
	}); */

	//await findOneListingByName(client, "Lovely Loft");
/* 	await createMultipleListings(client, [
		{
			name: 'Lovely Loft',
			summary: 'A charming loft in Paris',
			bedrooms: 1,
			bathrooms: 1,
		},
		{
			name: 'Lovely Loft2',
			summary: 'A charming loft in London',
			bedrooms: 1,
			bathrooms: 1,
		},
		{
			name: 'Lovely Loft3',
			summary: 'A charming loft in Stockholm',
			bedrooms: 1,
			bathrooms: 1,
		},
	]); */
	//await listDatabases(client);
	} catch (err) {
		console.error(err);
	} finally {
		await client.close();
	}
}

main().catch(console.error);

// Delete single listing

async function deleteListingsScrapedBeforeDate(client, date) {
	const result = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.deleteMany({ "last_scraped": { $lt: date} });
	console.log(`${result.deletedCount} documents was/were deleted`);
}

async function deleteListingByName(client, nameOfListing) {
	const result = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.deleteOne({ name: nameOfListing });
	console.log(`${result.deletedCount} documents deleted`);
}

// update all listings
async function updateAllListingsToHavePropertyType(client) {
	const result = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.updateMany({ property_type: { $exists: false } }, { $set: { property_type: 'unknown' } });
	console.log(`${result.matchedCount} documents matched the query criteria`);
	console.log(`${result.modifiedCount} documents was/were updated`);
}

// upsert listings
async function upsertListingByName(client, nameOfListing, updatedListing) {
	const result = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.updateOne({ name: nameOfListing }, { $set: updatedListing }, { upsert: true });
	console.log(`${result.matchedCount} documents matched the query criteria`);
	if (result.upstartedCount > 0) {
		console.log(`one document was inserted with id ${result.upstartedId}`);
	} else {
		console.log(`${result.modifiedCount}   documents were updated`);
	}
}

// update documents from the collection

async function updateListingsByName(client, nameOfListing, updatedListing) {
	const result = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.updateOne({ name: nameOfListing }, { $set: updatedListing });
	console.log(`${result.matchedCount} documents matched the query criteria`);
	console.log(`${result.modifiedCount} documents was/were modified`);
}

// read documents from a collection

async function findListingsWithMinimumBedroomsAndBathroomsAndMostRecentReviews(client, {
	minimumNumberOfBedrooms = 0,
	minimumNumberOfBathrooms = 0,
	maximumNumberOfResults = Number.MAX_SAFE_INTEGER,
} = {}) {
	const cursor = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.find({
			bedrooms: { $gte: minimumNumberOfBedrooms },
			bathrooms: { $gte: minimumNumberOfBathrooms }
		})
		.sort({
			'last_review': -1,
		})
		.limit(maximumNumberOfResults);
	
	const results = await cursor.toArray();
	if (results.length > 0) {
		console.log(`Found ${results.length} listings with ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms`);
		results.forEach((result, i) => {
			date = new Date(result.last_review).toDateString();
			console.log();
			console.log(`${i + 1}. ${result.name}`);
			console.log(`-_id:  ${result._id}`);
			console.log(`-bedrooms: ${result.bedrooms}`);
			console.log(`-bathrooms: ${result.bathrooms}`);
			console.log(`-recent_review: ${new Date(result.last_review).toDateString()}`);
		});
	} else {
		console.log(`listings with ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms`);
		}
}

async function findOneListingByName(client, nameOfListing) {
	const result =  await client.db("sample_airbnb").collection("listingsAndReviews").findOne({ name: nameOfListing });

	if (result) {
		console.log(`Found a ${nameOfListing}`);
		console.log(result);
	} else {
		console.log(`No ${nameOfListing} found`);
	}
}

async function createMultipleListings(client, newListing) {
	const result = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.insertMany(newListing);
	console.log(` ${result.insertedCount} new listings created with the following id (S):`);
	console.log(result.insertedIds);
}

async function createListing(client, newListing) {
	const result = await client
		.db('sample_airbnb')
		.collection('listingsAndReviews')
		.insertOne(newListing);
	console.log(`Created listing ${result.insertedId}`);
}

async function listDatabases(client) {
	const databasesList = await client.db().admin().listDatabases();
	
	console.log("Databases:");
	databasesList.databases.forEach(db => {
		console.log(`- ${db.name}`);
	});
}