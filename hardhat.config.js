require("@nomicfoundation/hardhat-toolbox");

class CustomReporter {
  constructor() {
    this.testResults = [];
  }

  onTestStart() {}
  onTestPass() {}
  onTestFail(test, error) {
    this.testResults.push({ status: 'fail', error: error.message });
  }
  onRunComplete() {}
}

task("run-test", "Runs a single test and returns the result")
  .addParam("testFile", "The test file to run")
  .setAction(async ({ testFile }, hre) => {
    console.log(`Starting test execution for file: ${testFile}`);
    const customReporter = new CustomReporter();
    try {
      console.log('Running test...');
      await hre.run("test", { 
        testFiles: [testFile],
        reporter: customReporter
      });
      console.log('Test completed successfully');
      return { status: 'pass' };
    } catch (error) {
      console.log(`Test failed with error: ${error.message}`);
      return { 
        status: 'fail', 
        error: error.message,
        testResults: customReporter.testResults 
      };
    }
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
