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
	// Make the appropriate DB calls
    await createReservation(
			client,
			'tom@example.com',
			'Lovely Loft',
			[new Date('2021-12-31'), new Date('2022-01-01')],
			{
				pricePerNight: 100,
				specialRequests: 'Late Checkout',
				breakfastIncluded: true,
				numberOfGuests: 2,
			}
		);
   /*  console.log(createReservationDocument("Lovely Loft", [new Date("2021-12-31"), new Date("2022-01-01")], {
      pricePerNight: 100, specialRequests: "Late Checkout", breakfastIncluded: true, numberOfGuests: 2
    })); */
	} finally {
		// Close the connection to the MongoDB cluster
		await client.close();
	}
}

main().catch(console.error);

// Add functions that make DB calls here

async function createReservation(client, userEmail, nameOfListing, reservationDates, reservationDetails) {
  const userCollection = client.db('sample_airbnb').collection('users');
  const listingsAndReviewsCollection = client.db('sample_airbnb').collection('listingsAndReviews');

  const reservation = createReservationDocument(nameOfListing, reservationDates, reservationDetails);

  const session = client.startSession();

  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };
  try {
     const transactionResults = await session.withTransaction(async () => {
      const usersUpdateResults = await userCollection.updateOne({ email: userEmail }, { $addToSet: { reservations: reservation } }, { session });
      console.log(`${usersUpdateResults.matchedCount} documents found in the users collection with the email address ${userEmail}`);
      console.log(`${usersUpdateResults.modifiedCount} documents was/were updated to included the reservation`);
     const isListingReservedResults =  await listingsAndReviewsCollection.findOne(
        { name: nameOfListing, datesReserved: { $in: reservationDates } }, {session}
     );
      if (isListingReservedResults) {
        await session.abortTransaction();
        console.error(`This listing is already reserved for at least one of the given dates. The reservation
        could not be created.`);
        console.error(`Any operations that already occured as part of this transction will be rolled back`);
        return;
      }
      const listingsAndReviewsUpdateResults =  await listingsAndReviewsCollection.updateOne(
         { name: nameOfListing },
         { $addToSet: { datesReserved: { $each: reservationDates } } },
         {session}
       );
       console.log(`${listingsAndReviewsUpdateResults.matchedCount} documents found in the listingsAndReviews collection with
       the name ${nameOfListing}.`);
       console.log(`${listingsAndReviewsUpdateResults.modifiedCount} document were updated to include the reservation dates.`);
     }, transactionOptions);
    
    if (transactionResults) {
      console.log(`The reservation was created successfully.`);
      
    } else {
      console.error(`The reservation was intentionally aborted`);
    }
    
  } catch (e) {
    console.log("The transaction was aborted due to an unexpected error: " + e);

  } finally {
    await session.endSession();
  }

}

function createReservationDocument(nameOfListing, reservationDates, reservationDetails) {
  let reservation = {
    name: nameOfListing,
    dates: reservationDates,
  }

  for (let detail in reservationDetails) {
    reservation[detail] = reservationDetails[detail];
  }
  return reservation;
}

