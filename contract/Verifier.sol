// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Verifier {

        
    event recovered(address indexed Lecturer, string courseCode);

    // function to add prefix to signed message and hash it again
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
    
    

    // student should pass in the course code, and the signature only
    function validate(string memory courseCode, bytes memory sig) public returns (address) {
        
        // Re-working the message needed
        // The message is student address + '/' + courseCode,  e.g. 0x11111/COMP3231
        bytes memory message = abi.encodePacked("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4/", courseCode);
        bytes32 encodedHash = keccak256(message);
        
        // Adding prefix
        bytes32 prefixedHash = prefixed(encodedHash);
        
        // Split the signature submitted by student
        (uint8 _v, bytes32 _r, bytes32 _s) = splitSignature(sig);
        
        // verify
        address signer = ecrecover(prefixedHash, _v, _r, _s);
        emit recovered(signer, courseCode);

        return signer;
    }
    
    function splitSignature(bytes memory sig) public pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }
    
      /*
      function validate(bytes memory sig) public returns (address) {
        // bytes memory message = abi.encodePacked(msg.sender, courseCode);
        bytes memory message = abi.encodePacked("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4/COMP3231");
        bytes32 encodedHash = keccak256(message);
        bytes32 prefixedHash = prefixed(encodedHash);
        
        (uint8 _v, bytes32 _r, bytes32 _s) = splitSignature(sig);
        address signer = ecrecover(prefixedHash, _v, _r, _s);
        return signer;
      }
      */
  
}