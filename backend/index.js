function add(a, b) {
  return a + b;
}

module.exports = { add };

if (require.main === module) {
  console.log("DevSecOps pipeline backend - Hello World");
}
