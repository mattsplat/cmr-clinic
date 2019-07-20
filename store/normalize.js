const normalize = function (data) {

  let charges = []
  for(var i in data) {
    if(data[i].charges) {
      /// extract charges to separate array
      charges = charges.concat(data[i].charges)
      /// switch array of charges on conviction to array of charge ids
      data[i].charges = data[i].charges.map(charge => charge.id)
    }
  }

  return {
    convictions: data,
    charges: charges
  }
};

export {
  normalize
};
