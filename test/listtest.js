var list1 = [];
var list2 = [];
var list3 = [];

var obj = {
  name: 'Yo Mama',
  key: 'thekey'
};

list1.push(obj);
list2.push(obj);
list3.push(obj);

console.log("list1:",list1);
console.log("list2:",list2);
console.log("list3:",list3);

console.log("----------------------------");
obj.name = 'Be Nice';

console.log("list1:",list1);
console.log("list2:",list2);
console.log("list3:",list3);

