export const randomString = (() => {
  const gen = (min: number, max: number) =>
    max++ && [...Array(max - min)].map((s, i) => String.fromCharCode(min + i))

  const sets = {
    num: gen(48, 57),
    alphaLower: gen(97, 122),
    alphaUpper: gen(65, 90),
    special: [...`~!@#$%^&*()_+-=[]\{}|;:'",./<>?`],
  }

  function* iter(len: number, set: any[]) {
    if (set.length < 1) set = Object.values(sets).flat()
    for (let i = 0; i < len; i++) yield set[(Math.random() * set.length) | 0]
  }

  return Object.assign(
    (len: number, ...set: any[]) => [...iter(len, set.flat())].join(''),
    sets
  )
})()


// console.log('OUTPUT: ', rnd(20));    // Use all sets
// // OUTPUT:  Kr8K1,f5hQa;YJC~7K9z
//
// console.log('OUTPUT: ', rnd(20, rnd.alphaLower));
// // OUTPUT:  cpjbkwvslxsofzvkekcw
//
// console.log('OUTPUT: ', rnd(20, rnd.alphaUpper, rnd.special));
// // OUTPUT:  S]|-X]=N}TZC,GE;=,.D
