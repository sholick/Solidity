const AdmSystem = artifacts.require("AdmSystem");

function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 2000);
  });
}

contract("Scenario3", async accounts => {

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

    // Random check student 4
    tx = await instance.balanceOf.call( stu_D );
    val = tx.toNumber();
    assert.equal(val, 18 * 100);
  });


  it("ROUND 3: Sale and check uni balance", async () => {
    const instance = await AdmSystem.deployed();

    //Bid
    tx = await instance.bidCourse("COMP6451", 1600, {from: stu_A});
    tx = await instance.bidCourse("COMP6451", 1800, {from: stu_C});
    tx = await instance.bidCourse("COMP6451", 1600, {from: stu_E});

    tx = await instance.bidCourse("COMP3441", 200, {from: stu_A});
    tx = await instance.bidCourse("COMP3441", 100, {from: stu_B});
    tx = await instance.bidCourse("COMP3441", 200, {from: stu_D});
    

    // D engage in sale with A, calls Admin as a delegate
    tx = await instance.startSale(stu_A, 200, Admin, {from: stu_D});
    // A transfers ether to D, Admin witnessed it and trigger a confirmation
    tx = await instance.confirmSale(stu_D, stu_A, 200, {value: 200, from: Admin});
    // Sale is executed automatically at the end of confirmSale

    let balance = await web3.eth.getBalance(instance.address);
    assert.equal(balance, 90200);

    

  });

  it("ROUND 3: Round closes admission", async () => {
    
    const instance = await AdmSystem.deployed();

    // A increases the bid
    tx = await instance.bidCourse("COMP6451", 1800, {from: stu_A});
    // close round
    tx = await instance.roundCloses({from: Admin});

    result = await instance.isAdmitted("COMP6451", stu_A);
    assert.equal(result, true);

    result = await instance.isAdmitted("COMP6451", stu_C);
    assert.equal(result, true);

    result = await instance.isAdmitted("COMP3441", stu_A);
    assert.equal(result, true);

    result = await instance.isAdmitted("COMP3441", stu_D);
    assert.equal(result, true);

  });

  it("ROUND 3: Round closes student balance", async () => {
    
    const instance = await AdmSystem.deployed();
    const endBalance = [0, 1800, 0, 1400, 1800];

    // Verify using for-loop
    for (i=0; i<5; i++) {
      tx = await instance.balanceOf.call(STUDENTS[i]);
      result = tx.toNumber();
      assert.equal(result, endBalance[i]);
    }

  });
});