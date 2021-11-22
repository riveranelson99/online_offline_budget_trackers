let db;
let budgetVersion;

// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  // Sanity check
  console.log('check db invoked');

  // Open a transaction on your BudgetStore db
  // Establish connection with db for read write access
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  // access your BudgetStore object
  // specify the specific object store you wish to access
  const store = transaction.objectStore('BudgetStore');

  // Get all records from store and set to a variable
  // Get all data from the previously specified object store
  const getAll = store.getAll();

  // If the request was successful
  // Define what to do next if all previous methods were successful
  getAll.onsuccess = function () {
    // If there are items in the store, we need to bulk add them when we are back online
    // Establish if condition that returns true if the array data is greater than the length of 0
    // If the value of true is returned, make a post request
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If our returned response is not empty
          // Establish an if condition based on the response from the post request if the response data is not 0
          if (res.length !== 0) {
            // Open another transaction to BudgetStore with the ability to read and write
            // Establish a connection to the database for read write access
            transaction = db.transaction(['BudgetStore'], 'readwrite');

            // Assign the current store to a variable
            // Specify the exact object store you are wanting to read write to
            const currentStore = transaction.objectStore('BudgetStore');

            // Clear existing entries because our bulk add was successful
            // Clear store data as it has been added to the server db and we do not wish to duplicate this data
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  // console log a success message to know function worked as intended
  console.log('Save record invoked');
  // Create a transaction on the BudgetStore db with readwrite access
  // establish a connection with the BudgetStore database for the purposes of read write access
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  // Access your BudgetStore object store
  // Access the specific object store you are attempting to target
  const store = transaction.objectStore('BudgetStore');

  // Add record to your store with add method.
  // Add the data to the object store
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);