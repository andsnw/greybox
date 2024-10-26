require("@nomicfoundation/hardhat-toolbox");

task("run-test", "Runs a single test and returns the result")
  .addParam("testFile", "The test file to run")
  .setAction(async ({ testFile }, hre) => {
    console.log(`Starting test execution for file: ${testFile}`);
    let result = { status: 'pass' };
    try {
      console.log('Running test...');
      await hre.run("test", { testFiles: [testFile] });
      console.log('Test completed successfully');
    } catch (error) {
      console.log(`Test failed with error: ${error.message}`);
      result = { status: 'fail', error: error.message };
    }
    console.log(`Test execution completed. Result: ${result.status}`);
    return result;
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  paths: {
    sources: "./contracts",
  },
  networks: {
    hardhat: {
      chainId: 1337
    }
  },
};
