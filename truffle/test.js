const AdmSystem = artifacts.require("AdmSystem");

function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 2000);
  });
}

contract("TestScenario1,2", async accounts => {

  const COO = accounts[0];
  const Admin = accounts[1];
  const Price_UOC = 1000;

  const stu_A = accounts[2];
  const stu_B = accounts[3];
  const stu_C = accounts[4];
  const stu_D = accounts[5];
  const stu_E = accounts[6];
  STUDENTS = [stu_A, stu_B, stu_C, stu_D, stu_E];

  const CS_1 = ["COMP6451", 6, 2];
  const CS_2 = ["COMP4212", 6, 3];
  const CS_3 = ["COMP3441", 6, 2];

  it("INIT: Add new Admin", async () => {
    const instance = await AdmSystem.deployed();
    res = await instance.newAdmin(Admin, {from: COO});
    val = await instance.isAdmin.call(Admin);
    assert.equal(val, true);
  });

  it("INIT: Sets Fee: 1000", async () => {
    const instance = await AdmSystem.deployed();
    val = await instance.setFee(Price_UOC, {from: COO});

    price = await instance.getPrice.call();
    assert.equal(price, 1000);
  });

  it("INIT: Add 5 new student", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.newStudent(stu_A, {from: Admin});
    tx = await instance.newStudent(stu_B, {from: Admin});
    tx = await instance.newStudent(stu_C, {from: Admin});
    tx = await instance.newStudent(stu_D, {from: Admin});
    tx = await instance.newStudent(stu_E, {from: Admin});

    //check 1
    val2 = await instance.isStudent.call(stu_C, {from: Admin});
    assert.equal(val2, true);
  });

  it("INIT: Add 3 new courses", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.newCourse( ...CS_1, {from: Admin});
    tx = await instance.newCourse( ...CS_2, {from: Admin});
    tx = await instance.newCourse( ...CS_3, {from: Admin});

    // Random check 1
    val2 = await instance.isCourse.call( CS_1[0], {from: Admin});
    assert.equal(val2, true);
  });

  it("INIT: Each student pay 18 UOC", async () => {
    const instance = await AdmSystem.deployed();
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_A});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_B});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_C});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_D});
    tx = await instance.buyToken({value: 18 * Price_UOC, from: stu_E});

  });


  it("ROUND 1: Check University balance", async () => {
    const instance = await AdmSystem.deployed();

    let balance = await web3.eth.getBalance(instance.address);
    assert.equal(balance, 90000);
  });

  it("ROUND 1: Check Student balance", async () => {
    const instance = await AdmSystem.deployed();

    for (i=0; i<5; i++) {
      tx = await instance.balanceOf.call( STUDENTS[i] );
      val = tx.toNumber();
      assert.equal(val, 18 * 100);
    }
  });

  it("ROUND 1: Bidding COMP6451", async () => {
    const instance = await AdmSystem.deployed();

    //Bid
    tx = await instance.bidCourse("COMP6451", 1200, {from: stu_A});
    tx = await instance.bidCourse("COMP6451", 800, {from: stu_B});
    tx = await instance.bidCourse("COMP6451", 1000, {from: stu_C});
    tx = await instance.bidCourse("COMP6451", 600, {from: stu_D});
    tx = await instance.bidCourse("COMP6451", 600, {from: stu_E});
    
    tx = await instance.roundCloses({from: Admin});
    result = await instance.isAdmitted("COMP6451", stu_A);
    assert.equal(result, true);

    result = await instance.isAdmitted("COMP6451", stu_C);
    assert.equal(result, true);

  });

  it("ROUND 1: Check balances after round closes", async () => {
    const instance = await AdmSystem.deployed();

    //Bid
 
    tx = await instance.balanceOf.call(stu_A);
    result = tx.toNumber();
    assert.equal(result, 600);

    tx = await instance.balanceOf.call(stu_B);
    result = tx.toNumber();
    assert.equal(result, 1800);

    tx = await instance.balanceOf.call(stu_C);
    result = tx.toNumber();
    assert.equal(result, 800);

    tx = await instance.balanceOf.call(stu_D);
    result = tx.toNumber();
    assert.equal(result, 1800);

    tx = await instance.balanceOf.call(stu_E);
    result = tx.toNumber();
    assert.equal(result, 1800);

  });


  it("ROUND 2: Bidding COMP4212", async () => {
    const instance = await AdmSystem.deployed();

    //Bid

    // test throw error for student A

    // When not enough balance, bidCourse exits with return value -1.
    tx = await instance.bidCourse.call("COMP4212", 800, {from: stu_A});
    result = tx.toNumber();
    assert.equal(result, -1);

    tx = await instance.bidCourse("COMP4212", 800, {from: stu_B});
    tx = await instance.bidCourse("COMP4212", 800, {from: stu_C});
    tx = await instance.bidCourse("COMP4212", 900, {from: stu_D});
    tx = await instance.bidCourse("COMP4212", 700, {from: stu_E});
    
    tx = await instance.roundCloses({from: Admin});

    result = await instance.isAdmitted("COMP4212", stu_B);
    assert.equal(result, true);

    result = await instance.isAdmitted("COMP4212", stu_C);
    assert.equal(result, true);

    result = await instance.isAdmitted("COMP4212", stu_D);
    assert.equal(result, true);

  });

  it("ROUND 2: Check end balance", async () => {

    const instance = await AdmSystem.deployed();
    
    tx = await instance.balanceOf.call(stu_A);
    result = tx.toNumber();
    assert.equal(result, 600);

    tx = await instance.balanceOf.call(stu_B);
    result = tx.toNumber();
    assert.equal(result, 1000);

    tx = await instance.balanceOf.call(stu_C);
    result = tx.toNumber();
    assert.equal(result, 0);

    tx = await instance.balanceOf.call(stu_D);
    result = tx.toNumber();
    assert.equal(result, 900);

    tx = await instance.balanceOf.call(stu_E);
    result = tx.toNumber();
    assert.equal(result, 1800);

  });
});