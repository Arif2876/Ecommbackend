const express = require("express");
const router = new express.Router();
const cartsControllers = require("../../controllers/carts/cartsController");
const userauthenticate = require("../../middleware/user/userauthenticate");

//  carts routers
router.post("/addtocart/:id", userauthenticate, cartsControllers.AddtoCart);
router.get("/getcarts", userauthenticate, cartsControllers.getCartsValue);

router.delete(
  "/removesingleiteam/:id",
  userauthenticate,
  cartsControllers.removeSingleiteam
);

router.delete(
  "/removeitems/:id",
  userauthenticate,
  cartsControllers.removeAllitems
);

// Delete cart data  when order done
router.delete(
  "/removecartdata",
  userauthenticate,
  cartsControllers.DeleteCartsData
);

module.exports = router;
