const cartsdb = require("../../model/carts/cartsModel");
const productsdb = require("../../model/product/ProductModel");
exports.AddtoCart = async (req, res) => {
  const { id } = req.params;

  try {
    const productfind = await productsdb.findOne({ _id: id });
    const carts = await cartsdb.findOne({
      userid: req.userId,
      productid: productfind._id,
    });
    console.log("productfind", productfind);

    if (productfind?.quantity >= 1) {
      if (carts?.quantity >= 1) {
        // add to carts
        carts.quantity = carts.quantity + 1;
        await carts.save();
        // decerement product quantity
        productfind.quantity = productfind.quantity - 1;
        await productfind.save();
        res
          .status(200)
          .json({ message: "product Succesfully  Increment in your cart" });
      } else {
        const addtocart = new cartsdb({
          userid: req.userId,
          productid: productfind._id,
          quantity: 1,
        });
        await addtocart.save();
        productfind.quantity = productfind.quantity - 1;
        await productfind.save();
        res
          .status(200)
          .json({ message: "product Succesfully  Added in your cart" });
      }
    } else {
      res.status(200).json({ message: "This product  is sold out" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

//getCartsValue
exports.getCartsValue = async (req, res) => {
  try {
    const getCarts = await cartsdb.aggregate([
      {
        $match: { userid: req.userMainId },
      },
      {
        $lookup: {
          from: "productsmodels",
          localField: "productid",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // getting First data from  product details array

      {
        $project: {
          _id: 1,
          userid: 1,
          productid: 1,
          quantity: 1,
          productDetails: { $arrayElemAt: ["$productDetails", 0] }, // Extract first element of the product array
        },
      },
    ]);
    res.status(200).json(getCarts);
  } catch (error) {
    res.status(400).json(error);
  }
};

// removeSingleiteam

exports.removeSingleiteam = async (req, res) => {
  const { id } = req.params;

  try {
    const productfind = await productsdb.findOne({ _id: id });
    const carts = await cartsdb.findOne({
      userid: req.userId,
      productid: productfind._id,
    });
    if (!carts) {
      res.status(400).json({ error: "cart item not found" });
    }
    console.log("carts", carts);

    if (carts.quantity == 1) {
      const deleteCartItem = await cartsdb.findByIdAndDelete({
        _id: carts._id,
      });

      // Increment  product quantity
      productfind.quantity = productfind.quantity + 1;
      await productfind.save();
      res.status(200).json({
        message: "your item sucessfully remove in you carts",
        deleteCartItem,
      });
    } else if (carts.quantity > 1) {
      carts.quantity = carts.quantity - 1;
      await carts.save();

      // incrementt product quantity
      productfind.quantity = productfind.quantity + 1;
      await productfind.save();
      res
        .status(200)
        .json({ message: "your item sucessfully Decrement in your cart" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

//removeAllitems

exports.removeAllitems = async (req, res) => {
  const { id } = req.params;
  try {
    const productfind = await productsdb.findOne({ _id: id });
    const carts = await cartsdb.findOne({
      userid: req.userId,
      productid: productfind._id,
    });
    if (!carts) {
      res.status(400).json({ error: "cart item not found" });
    }

    const deleteCartItem = await cartsdb.findByIdAndDelete({ _id: carts._id });

    // product increment
    productfind.quantity = productfind.quantity + carts.quantity;
    await productfind.save();
    res.status(200).json({
      message: "Your items sucessfully remove in your carts ",
      deleteCartItem,
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

// DeleteCartsData

exports.DeleteCartsData = async (req, res) => {
  try {
    const DeleteCarts = await cartsdb.deleteMany({ userid: req.userId });
    res.status(200).json(DeleteCarts);
  } catch (error) {
    res.status(400).json(error);
  }
};
