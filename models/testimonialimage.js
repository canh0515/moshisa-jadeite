'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TestimonialImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  TestimonialImage.init({
    imageUrl: DataTypes.STRING,
    testimonialId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TestimonialImage',
  });
  return TestimonialImage;
};