// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract AdmSystem {

    string public constant name = "Course_Admission";
    string public symbol = "BSC";
    uint8 public constant decimals = 18;  
    uint public priceToken = 999;   // init value
    uint startTime;


    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
    event Transfer(address indexed from, address indexed to, uint tokens);
    event CheckAdmin(address indexed addr);
    event Recovered(address indexed Lecturer, string courseCode);
    event StartRecover(address indexed sender, string courseCode, bytes32 hash);
    event CompareHash(bytes32 reworked, bytes32 given);
    event Admitted(address addr, string courseCode);
    event Refunded(address addr, string courseCode);

    mapping(address => uint256) balances;

    mapping(address => mapping (address => uint256)) allowed;
    
    mapping(address => bool) Delegate;
    
    mapping(address => bool) UniversityAdmins;
    
    mapping(address => Student) Students;
    
    mapping(address => bool) StudentRecord;
    
    mapping(string => Course) Courses;
    
    mapping(string => bool) CourseRecord;
    
    mapping(address => bool) LecturerRecord;
    
    string[] CourseNames;
    
    uint256 totalSupply_;
    
    uint256 deadline = 999999999999;      // Initial deadline
    
    address payable public  COO;

    using SafeMath for uint256;
    
    struct Bid {
        address addr;
        uint offer;
    }
    
    struct Course {
        string code;
        uint UOC;
        uint quota;
        uint numAdmitted;
        mapping(address => bool) admitted;
        Bid[] waitlist;
        address lecturer;
        string[] preReq;
        mapping(address => bool) completed;
    }
    

    mapping (address => mapping (string => bool)) Lecturers;
    
    struct Student {
        uint UOC_limit;
    }
    
    modifier onlyCOO() {
        require (msg.sender == COO, "Unauthorized");
        _;
    }
    
    modifier onlyAdmin() {
        require (isAdmin(msg.sender), "Unauthorized");
        _;
    }
    
    modifier onlyStudent() {
        require (isStudent(msg.sender), "Unauthorized");
        _;
    }
    
    modifier onlyBeforeDeadline() {
        require (block.timestamp < deadline, "This round has closed.");
        _;
    }
    
    modifier onlyDelegate() {
        require(Delegate[msg.sender], "Only delegates allowed");
        _;
    }
    
    modifier onlyLecturer() {
        require(LecturerRecord[msg.sender], "Only Lecturers allowed.");
        _;
    }


   constructor(string memory coinName, address payable COO_address) public payable {
    symbol = coinName;
    totalSupply_ = 0;
    balances[msg.sender] = totalSupply_;
    COO = COO_address;
    }  
    
    
    function isAdmin(address addr) public view returns (bool) {
        return UniversityAdmins[addr];
    }
    
    function isStudent(address addr) public view returns (bool) {
        return StudentRecord[addr];
    }
    
    function isCourse(string memory code) public view returns (bool) {
        return CourseRecord[code];
    }
    
    function isAdmitted(string memory code, address addr) public view returns (bool) {
        require (isCourse(code), "Invalid course name.");
        return Courses[code].admitted[addr];
    }
    
    function isLecturer(address addr) public view returns (bool) {
        return LecturerRecord[addr];
    }
    
    function cashOut(uint amount) public onlyCOO returns (bool) {
        require (address(this).balance >= amount, "Invalid amount: Exceeded.");
        COO.transfer(amount);
        return true;
    }
    
    function newAdmin(address addr) public onlyCOO returns (bool) {
        require ( !isAdmin(addr), "Already registered.");
        UniversityAdmins[addr] = true;
        return true;
    }

    function revokeAdmin(address addr) public onlyCOO returns (bool) {
        require(isAdmin(addr), "Not an admin.");
        UniversityAdmins[addr] = false;
        return true;
    }

    function transferCOO(address addr) public onlyCOO returns (bool) {
        COO = payable(addr);
        return true;
    }

    function setFee(uint fee) public onlyCOO returns (bool) {
        priceToken = fee;
        return true;
    }

    function getPrice() public view returns (uint) {
        return priceToken;
    }
    
    function newStudent(address addr) public onlyAdmin returns (bool) {
        // require ( !isStudent(addr), "Already registered.");
        StudentRecord[addr] = true;
        Student storage new_st = Students[addr];
        new_st.UOC_limit = 0;
        return true;
    }
    
    function LecturerCourses(address addr, string memory code) public onlyAdmin returns (bool) {
        require (isCourse(code), "Course code unknown.");
        if ( !isLecturer(addr) ) {
            LecturerRecord[addr] = true;
        }
        Lecturers[addr][code] = true;
        Courses[code].lecturer = addr;
        return true;
    }
    
    function checkLecturerCourse(address addr, string memory code) public view returns (bool) {
        require(isLecturer(addr), "Not a lecturer.");
        require(isCourse(code), "Not a valid course.");
        return Lecturers[addr][code];
    }
    
    
    function newCourse(string memory code, uint UOC, uint quota) public onlyAdmin returns (bool) {
        require ( !isCourse(code), "There is a course with the same name.");
        // require( isLecturer(prof), "Address is not a lecturer.");
        Course storage new_cs = Courses[code];
        new_cs.code = code;
        new_cs.UOC = UOC;
        new_cs.quota = quota;
        new_cs.numAdmitted = 0;
        // new_cs.lecturer = prof;
        CourseRecord[code] = true;
        CourseNames.push(code);
        return true;
    }
    
    function addStudentCompleteRecord(address addr, string memory code) public onlyAdmin returns (bool) {
        require (isCourse(code), "Course is not in record.");
        require (isStudent(addr), "Not a student.");
        Courses[code].completed[addr] = true;
        return true;
    }

    function addPreReq(string memory father, string memory son) public onlyAdmin returns (bool) {
        require (isCourse(father) && isCourse(son), "Course not in record.");
        Courses[father].preReq.push( son );
        return true;
    }
    
    function viewCourse(string memory code) public view returns (uint, uint, uint, uint, address) {
        require( isCourse(code), "Invalid code.");
        Course storage cs = Courses[code];
        return (cs.UOC, cs.quota, cs.numAdmitted, cs.waitlist.length, cs.lecturer);
    }
    
    
    function issueAndTransfer(uint256 uoc, address addr) internal returns (bool) {
        uint amount = uoc * 100;
        totalSupply_ += amount;
        balances[addr] = balances[addr].add(amount);
        return true;
    }
    
    function decBalance(uint256 amount, address addr) internal returns (bool) {
        if (balances[addr] >= amount) {
            balances[addr] = balances[addr].sub(amount);
            return true;
        }
        return false;
    }
    
    function incBalance(uint256 amount, address addr) internal returns (bool) {
        balances[addr] = balances[addr].add(amount);
        return true;
    }
    
    function buyToken() public payable onlyStudent returns (bool) {
        require (msg.value > 0, "No payment");
        require (msg.value % priceToken == 0, "Must be multiple of price per UOC");
        uint uoc = msg.value / priceToken;
        
        if ( issueAndTransfer(uoc, msg.sender) ) {
            Students[msg.sender].UOC_limit = Students[msg.sender].UOC_limit.add(uoc);
            return true;
        }
        return false;
    }
    
    // insert a new bid into the back of waitlist and bubble it up
    function insertBid(string memory code, Bid memory newBid) internal returns (uint) {
        
        require(Students[msg.sender].UOC_limit >= Courses[code].UOC, "UOC insufficient.");
        
        Students[msg.sender].UOC_limit -= Courses[code].UOC;
        Bid[] storage waitlist = Courses[code].waitlist;
        waitlist.push( newBid );
        uint length = waitlist.length;
        uint offer = newBid.offer;
        
        for (uint i = length - 1; i > 0; i--) {
            if (offer > waitlist[i-1].offer) {
                waitlist[i] = waitlist[i-1];
                waitlist[i-1] = newBid;
            }
            else
                return i;
        }
        return 0;
    }
    
    function findBid(string memory code, address addr) internal view returns (int) {
        Bid[] memory waitlist = Courses[code].waitlist;
        if (waitlist.length > 0) {
            for (uint i = 0; i <= waitlist.length - 1; i++) {
                if (waitlist[i].addr == addr)
                    return int(i);
            }
        }
        return -1;
    }
    
    function deleteBid(string memory code, address addr) internal returns (bool) {
        
        int index = findBid(code, addr);
        if (index < 0)
            return false;
            
        Bid[] storage waitlist = Courses[code].waitlist;
        uint offer = waitlist[uint(index)].offer;
        
        for (uint i = uint(index + 1); i < waitlist.length; i++) {
            waitlist[i-1] = waitlist[i];
        }
        waitlist.pop();
        Students[msg.sender].UOC_limit += Courses[code].UOC;
        
        if (incBalance(offer, addr))
            return true;
        return false;
    }
    
    // Bid Course function: Returns 0,1,2,3..... number when successful, indicates student's position in queue, -1 if rejected for whatever reason
    // First checks if student have already bidded, and delete the bid if found one. So replacing a current bid also uses this function
    function bidCourse(string memory code, uint amount) public payable onlyStudent onlyBeforeDeadline returns (int) {
        require ( isCourse(code), "Invalid course code");
        require ( !Courses[code].admitted[msg.sender], "Already admitted.");

        // Check Pre-requisite
        if (Courses[code].preReq.length != 0) {
            uint leng = Courses[code].preReq.length;
            for (uint i=0; i<leng; i++) {
                string memory toCheck = Courses[code].preReq[i];
                if ( !Courses[toCheck].completed[msg.sender] )
                    return -1;
            }
        }
        
        // Delete the bid first if it already exist, i.e. the student wants to change the bid
        if (findBid(code, msg.sender) != -1) {
            deleteBid(code, msg.sender);
        }
        
        // Check balance after delete old bid
        if ( balanceOf(msg.sender) < amount ) {
            return -1;
        }
        
        // Insert the bid into the waitlist
        if (decBalance(amount, msg.sender)) {
            int index = int( insertBid( code, Bid(msg.sender, amount)) );
            return index;
        }
        
        return 0;
    }
    
    // same as above function, only change the prerequisite requirement with validate signature
    function bidCourseWithSign(string memory code, uint amount, bytes32 hash, uint8 _v, bytes32 _r, bytes32 _s) public onlyStudent onlyBeforeDeadline returns (int) {
        require ( isCourse(code), "Invalid course code");
        require ( !Courses[code].admitted[msg.sender], "Already admitted.");
        emit StartRecover(msg.sender, code, hash);

        //rework hash
        bytes32 messageHash = keccak256(abi.encodePacked(code, msg.sender));
        emit CompareHash(messageHash, hash);
        require(messageHash == hash, "Hash is not the same");
        address signer_address = checkSignature(hash, _v, _r, _s);

        emit Recovered(signer_address, code);

        if (signer_address != Courses[code].lecturer) {
            return -1;
        }
        
        // Delete the bid first if it already exist, i.e. the student wants to change the bid
        if (findBid(code, msg.sender) != -1) {
            deleteBid(code, msg.sender);
        }
        
        // Check balance after delete old bid
        if ( balanceOf(msg.sender) < amount ) {
            return -1;
        }
        
        // Insert the bid into the waitlist
        if (decBalance(amount, msg.sender)) {
            int index = int( insertBid( code, Bid(msg.sender, amount)) );
            return index;
        }
        
        return 0;
    }
    
    function roundCloses() public onlyAdmin returns (bool) {
        // closes this round and admit Students
        uint num = CourseNames.length;
        for (uint i = 0; i < num; i++) {
            string memory code = CourseNames[i];
            Course storage CS = Courses[code];
            Bid[] storage list = CS.waitlist;
            uint count = list.length;
            uint tmp;
            bool FULL = false;
            
            for (uint j = 0; j < count; j++) {
                Bid memory b = list[j];
                
                // Quota full
                if (CS.numAdmitted >= CS.quota) {
                    tmp = j;
                    FULL = true;
                    break;
                }
                // Admission
                CS.numAdmitted++;
                CS.admitted[b.addr] = true;
                emit Admitted(b.addr, code);
            }
            
            // Refund starting from position stopped
            if (FULL) {
                for (uint j = tmp; j < count; j++) {
                    Students[list[j].addr].UOC_limit += Courses[code].UOC;
                    incBalance(list[j].offer, list[j].addr);
                    emit Refunded(list[j].addr, code);
                }
            }
            // Reset the waitlist
            delete Courses[code].waitlist;
        }
        return true;
    }
    
    function setDeadline(uint time) public onlyAdmin returns (bool) {
        deadline = time;
        return true;
    }
    
    function totalSupply() public view returns (uint256) {
    return totalSupply_;
    }
    
    function balanceOf(address tokenOwner) public view returns (uint) {
        return balances[tokenOwner];
    }
    

    function transfer(address receiver, uint numTokens) internal returns (bool) {
        require(numTokens <= balances[msg.sender]);
        balances[msg.sender] = balances[msg.sender].sub(numTokens);
        balances[receiver] = balances[receiver].add(numTokens);
        emit Transfer(msg.sender, receiver, numTokens);
        return true;
    }

    function startSale(address buyer, uint numTokens, address delegate) public onlyStudent returns (bool) {
        require (isStudent(buyer), "Only student can buy tokens.");
        require (!Delegate[delegate], "One person can only be delegate to one sale at a time.");
        
        allowed[msg.sender][delegate] = numTokens;
        Delegate[delegate] = true;
        emit Approval(msg.sender, buyer, numTokens);
        return true;
    }
    
    function confirmSale(address seller, address buyer, uint numTokens) public payable onlyDelegate returns (bool) {
        require(allowed[seller][msg.sender] >= 0, "Student pair is not in a sale.");
        require(msg.value == numTokens * priceToken / 100 / 10, "Fee is not exactly the amount wanted");
        require(allowed[seller][msg.sender] == numTokens, "Amount is higher than agreed.");
        return executeSale(seller, buyer, numTokens);
    }

    function allowance(address owner, address delegate) public view returns (uint) {
        return allowed[owner][delegate];
    }
    
    
    // function to execute when a sale is confirmed
    function executeSale(address owner, address buyer, uint numTokens) internal returns (bool) {
        require(numTokens <= balances[owner]);    
        require(numTokens <= allowed[owner][msg.sender]);
    
        balances[owner] = balances[owner].sub(numTokens);
        allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);
        
        uint AmountReceived = numTokens;
        balances[buyer] = balances[buyer].add(AmountReceived);
        return true;
    }


    function checkSignature(bytes32 h, uint8 v, bytes32 r, bytes32 s) public pure returns (address signer) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";    
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix,h));  
        signer = ecrecover(prefixedHash, v, r, s); 
    }
}

library SafeMath { 
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
      assert(b <= a);
      return a - b;
    }
    
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
      uint256 c = a + b;
      assert(c >= a);
      return c;
    }
}