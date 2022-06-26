# Solidity

This is a research project in late 2021. The purpose is to deploy a hypothetical admission system for students to apply for courses on the Ethereum blockchain.<br/>
Whenever students apply for a course, they buy ERC20 tokens using ETH, which they must then use to bid for the courses they wish to register for.<br/>
Students can trade the admission tokens among themselves, but paying 10% to UNSW in the process.<br/><br/>
Every once in a while, a school administrator runs the RoundCloses() function to close the round and admit students to courses, releasing the tokens for outbidded students to bid on the next round.<br/>
The whole contract is written with simplicity and gas-efficiency in mind.<br/><br/>
For more information regarding the structure of the smart contract and the respective functions, please read the report PDF.<br/>
<br/>
Truffle test scripts also attached which test admission scenarios successfully.
