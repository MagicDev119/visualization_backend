const VisualizationModel = require("../models/visualizationModel");

module.exports = {
  ADD_VISION: async data => {
    const newVision = await new VisualizationModel({
      userId: data.userInfo.id,
      link: data.fileName,
      description: data.description,
      type: data.type,
      thumbnail_url: data.thumbnail_url
    }).save();

    const findQuery = {
      userId: data.userInfo.id
    }
    let visualizationList = await VisualizationModel.find(findQuery)

    return {
      ...newVision,
      cnt: visualizationList.length
    };
  },
};