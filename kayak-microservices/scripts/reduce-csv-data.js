const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Reduce CSV files by half while maintaining data diversity
 * Strategy: Keep every other row to reduce by 50%
 */

async function reduceCSV(inputFile, outputFile) {
  console.log(`\n📄 Processing: ${path.basename(inputFile)}`);
  
  const readStream = fs.createReadStream(inputFile);
  const writeStream = fs.createWriteStream(outputFile);
  
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let keptCount = 0;
  let header = '';

  for await (const line of rl) {
    if (lineCount === 0) {
      // Always keep the header
      header = line;
      writeStream.write(line + '\n');
      keptCount++;
    } else if (lineCount % 2 === 0) {
      // Keep every other row (even numbered rows)
      writeStream.write(line + '\n');
      keptCount++;
    }
    lineCount++;
    
    // Progress indicator
    if (lineCount % 10000 === 0) {
      process.stdout.write(`\r   Processing line ${lineCount.toLocaleString()}...`);
    }
  }

  writeStream.end();
  console.log(`\r   ✅ Processed ${lineCount.toLocaleString()} lines`);
  console.log(`   ✅ Kept ${keptCount.toLocaleString()} lines (${((keptCount/lineCount) * 100).toFixed(1)}%)`);
  
  return { original: lineCount, reduced: keptCount };
}

async function main() {
  console.log('🚀 Starting CSV Data Reduction Process...\n');
  console.log('=' .repeat(60));
  
  const dataDir = path.join(__dirname, 'stays-data');
  
  const listingsInput = path.join(dataDir, 'listings 2.csv');
  const listingsOutput = path.join(dataDir, 'listings_reduced.csv');
  
  const reviewsInput = path.join(dataDir, 'reviews 2.csv');
  const reviewsOutput = path.join(dataDir, 'reviews_reduced.csv');
  
  // Check if input files exist
  if (!fs.existsSync(listingsInput)) {
    console.error(`❌ Error: ${listingsInput} not found`);
    process.exit(1);
  }
  
  if (!fs.existsSync(reviewsInput)) {
    console.error(`❌ Error: ${reviewsInput} not found`);
    process.exit(1);
  }
  
  try {
    // Reduce listings
    const listingsStats = await reduceCSV(listingsInput, listingsOutput);
    
    // Reduce reviews
    const reviewsStats = await reduceCSV(reviewsInput, reviewsOutput);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log('='.repeat(60));
    console.log(`\n📌 Listings:`);
    console.log(`   Original: ${listingsStats.original.toLocaleString()} rows`);
    console.log(`   Reduced:  ${listingsStats.reduced.toLocaleString()} rows`);
    console.log(`   Output:   ${path.basename(listingsOutput)}`);
    
    console.log(`\n📌 Reviews:`);
    console.log(`   Original: ${reviewsStats.original.toLocaleString()} rows`);
    console.log(`   Reduced:  ${reviewsStats.reduced.toLocaleString()} rows`);
    console.log(`   Output:   ${path.basename(reviewsOutput)}`);
    
    console.log('\n✅ CSV reduction complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during CSV reduction:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
