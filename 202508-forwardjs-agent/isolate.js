import ivm from 'isolated-vm';
const isolate = new ivm.Isolate();

const context = isolate.createContextSync();

const jail = context.global;
jail.setSync('smallestPrimeFactor', function (n) {
    if (n <= 1) {
        return null;
    }
    for (let i = 2; i <= Math.floor(Math.sqrt(n)); i++) {
        if (n % i === 0) {
            return i;
        }
    }
    return n; // n is prime if no factors found
});
console.log(context.evalSync('smallestPrimeFactor(12)'))