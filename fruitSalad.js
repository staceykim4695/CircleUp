const request = require('request');

request.get('https://s3-us-west-1.amazonaws.com/circleup-engr-interview-public/simple-etl.jsonl', (error, response, body) => {
  //parses the data to a JSON
  let data = body.split('\n').filter(f => f.length).map(m => JSON.parse(m));

  //1.1 Extract and Transform:
  let fruitSalad = [];
  data.forEach((user) => {
    //most_common_word_in_posts: most common word(s) in this user’s posts
    //use hashmap to keep track
    let wordHashMap = {};
    user.posts.forEach((postObj) => {
      //remove all punctuation from posts, split to individual words, and convert to lower case
      let splitPost = postObj.post.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ').map(word => word.toLowerCase());
      splitPost.forEach((word) => {
        if (wordHashMap.hasOwnProperty(word)) {
          wordHashMap[word]++
        } else {
          wordHashMap[word] = 1;
        }
      });
    });
    let mostCommonWord = Object.keys(wordHashMap).reduce((a, b) => wordHashMap[a] > wordHashMap[b] ? a : b);

    //balance: decimal version of this user's account balance
    //assume that the balances are <1 mil, so it will have at most 1 comma
    let userBalance = 0;
    let index = user.balance.indexOf(',');
    if (index > -1) {
      //always remove '$' and commas; use parseFloat to convert to integer
      userBalance = parseFloat(user.balance.slice(1, index) + user.balance.slice(index + 1));
    } else {
      userBalance = parseFloat(user.balance.slice(1));
    }

    //transformed object:
    let yummy = {
      'full_name': user.name.first + ' ' + user.name.last,
      'post_count': user.posts.length,
      'most_common_word_in_posts': mostCommonWord,
      'age': user.age,
      'is_active': user.isActive,
      'top_tags': user.tags.slice(0, 3),
      'favorite_fruit': user.favoriteFruit,
      'balance': userBalance
    };
    //push to the fruitSalad array, so we can have a list of the objects
    fruitSalad.push(yummy);
  });



  //1.2 Analysis:
  //total_post_count: total number of posts in the dataset
  let totalPostCount = fruitSalad.map((user) => user.post_count).reduce((a, b) => a + b);

  //most_common_word_overall: most common of the most common words in the dataset
  let wordCount = {};
  fruitSalad.forEach((user) => {
    if (wordCount.hasOwnProperty(user.most_common_word_in_posts)) {
      wordCount[user.most_common_word_in_posts]++;
    } else {
      wordCount[user.most_common_word_in_posts] = 1;
    }
  });
  let mostCommWordOverall = Object.keys(wordCount).reduce((a, b) => wordCount[a] > wordCount[b] ? a : b);

  //most_common_top_tag: most common of the top tag(s) in the dataset
  let tagsCount = {};
  fruitSalad.forEach((user) => {
    user.top_tags.forEach((tag) => {
      if (tagsCount.hasOwnProperty(tag)) {
        tagsCount[tag]++;
      } else {
        tagsCount[tag] = 1;
      }
    });
  });
  let mostCommTagOverall = Object.keys(tagsCount).reduce((a, b) => tagsCount[a] > tagsCount[b] ? a : b);

  //account_balance:
  let acctBalance = {};
  //total: sum of all account balances for all users
  let acctBalanceTotal = fruitSalad.map((user) => user.balance).reduce((a, b) => a + b);
  //round it to two decimal places:
  acctBalance['total'] = Math.round(acctBalanceTotal*100)/100;
  //mean: average account balance for all users
  let mean = acctBalanceTotal/fruitSalad.length;
  acctBalance['mean'] = Math.round(mean*100)/100;
  //active_user_mean: average account balance for active users
  //activeUsers is an array of the user objects in which isActive = true
  let activeUsers = fruitSalad.filter((user) => user.is_active === true);
  //total balances of all active users:
  let activeUsersAcctBalance = activeUsers.map((activeUser) => activeUser.balance).reduce((a, b) => a + b);
  let activeUserMean = activeUsersAcctBalance/activeUsers.length;
  acctBalance['active_user_mean'] = Math.round(activeUserMean*100)/100;
  //strawberry_lovers_mean: average account balance for users who favor strawberries
  let sbLovers = fruitSalad.filter((user) => user.favorite_fruit === 'strawberry');
  let sbLoversAcctBal = sbLovers.map((sbLover) => sbLover.balance).reduce((a, b) => a + b);
  let sbLoversMean = sbLoversAcctBal/sbLovers.length;
  acctBalance['strawberry_lovers_mean'] = Math.round(sbLoversMean*100)/100;

  //age:
  let age = {};
  //allAges is an array with only ages within each user object
  let allAges = fruitSalad.map((user) => user.age);
  //min: minimum age of all users
  let minAge = Math.min(...allAges);
  age['min'] = minAge;
  //max: maximum age of all users
  let maxAge = Math.max(...allAges);
  age['max'] = maxAge;
  //mean: mean age of all users
  let allAgesTotal = allAges.reduce((a, b) => a + b);
  let allUsersMean = allAgesTotal/allAges.length;
  age['mean'] = allUsersMean;
  //median: median age of all users
  //sortedAges is an array of the ages sorted from youngest to oldest:
  let sortedAges = allAges.sort((a, b) => a - b);
  //there are 50 entries in total so the median will be considered with an even number
  let index = sortedAges.length/2;
  let median = sortedAges[index];
  age['median'] = median;
  //age_with_most_apple_lovers: age with the most users who favor apples
  //appleLovers is an array of users, in which favorite_fruit = apples:
  let appleLovers = fruitSalad.filter((user) => user.favorite_fruit === 'apple');
  let appleLoversAges = {};
  appleLovers.forEach((appleLover) => {
    if (appleLoversAges.hasOwnProperty(appleLover.age)) {
      appleLoversAges[appleLover.age]++;
    } else {
      appleLoversAges[appleLover.age] = 1;
    }
  })
  let ageWithMostAppleLovers = Object.keys(appleLoversAges).reduce((a, b) => appleLoversAges[a] > appleLoversAges[b] ? a : b);
  //need to use parseFloat to convert to integer
  age['age_with_most_apple_lovers'] = parseFloat(ageWithMostAppleLovers);
  //youngest_age_hating_apples: minimum age of all users who do not favor apples
  let appleHaterAges = fruitSalad.filter((user) => user.favorite_fruit !== 'apple').map(user => user.age);
  let minAppleHaterAge = Math.min(...appleHaterAges);
  age['youngest_age_hating_apples'] = minAppleHaterAge;
  //oldest_age_hating_apples: maximum age of all users who do not favor apples
  let maxAppleHaterAge = Math.max(...appleHaterAges);
  age['oldest_age_hating_apples'] = maxAppleHaterAge;

  //favorite_fruit:
  let favoriteFruit = {};
  //active_users:
  //already have array of active users, activeUsers
  let activeUsersFruits = {};
  activeUsers.forEach((user) => {
    if (activeUsersFruits.hasOwnProperty(user.favorite_fruit)) {
      activeUsersFruits[user.favorite_fruit]++;
    } else {
      activeUsersFruits[user.favorite_fruit] = 1;
    }
  });
  let activeUsersFavFruit = Object.keys(activeUsersFruits).reduce((a, b) => activeUsersFruits[a] > activeUsersFruits[b] ? a : b);
  favoriteFruit['active_users'] = activeUsersFavFruit;

  //median age:
  let medianAgeFruits = {};
  //medianAgeUsers is an array of all users with an age equal to the median age
  let medianAgeUsers = fruitSalad.filter(user => user.age === median);
  medianAgeUsers.forEach((user) => {
    if (medianAgeFruits.hasOwnProperty(user.favorite_fruit)) {
      medianAgeFruits[user.favorite_fruit]++;
    } else {
      medianAgeFruits[user.favorite_fruit] = 1;
    }
  });
  let medianAgeFavFruit = Object.keys(medianAgeFruits).reduce((a, b) => medianAgeFruits[a] > medianAgeFruits[b] ? a : b);
  favoriteFruit['median_age'] = medianAgeFavFruit;

  //acct_balance_gt_mean:
  let acctBalanceGtMeanUsers = {};
  //array of all users with acct balances greater than the mean
  let gtMean = fruitSalad.filter(user => user.balance > allUsersMean);
  gtMean.forEach((user) => {
    if (acctBalanceGtMeanUsers.hasOwnProperty(user.balance)) {
      acctBalanceGtMeanUsers[user.balance]++;
    } else {
      acctBalanceGtMeanUsers[user.balance] = 1;
    }
  });
  let acctBalanceGtMean = Object.keys(acctBalanceGtMeanUsers).reduce((a, b) => acctBalanceGtMeanUsers[a] > acctBalanceGtMeanUsers[b] ? a : b);
  favoriteFruit['acct_balance_gt_mean'] = parseFloat(acctBalanceGtMean);

  let summary = {
    'total_post_count': totalPostCount,
    'most_common_word_overall': mostCommWordOverall,
    'most_common_top_tag': mostCommTagOverall,
    'account_balance': acctBalance,
    'age': age,
    'favorite_fruit': favoriteFruit
  }
  console.log(summary);
});
