const { ErrorRunner, catchWrapper } = require('../utils/errors');
const APIFeatures = require('./APIFeatures');

exports.createOne = (Model) =>
  catchWrapper(async (req, res, next) => {
    const docName = `${Model.collection.collectionName.slice(0, -1)}`;
    const document = await Model.create(req.body);

    res.status(201);
    res.json({ success: true, data: { [docName]: document } });
  });

exports.getOne = (Model, populateOptions) =>
  catchWrapper(async (req, res, next) => {
    const { id } = req.params;
    const docName = `${Model.collection.collectionName.slice(0, -1)}`;
    let query = Model.findById(id);
    if (populateOptions) query = query.populate(populateOptions);
    const document = await query;

    if (!document) {
      return next(new ErrorRunner(`No ${docName} found with id ${id}.`, 404));
    }

    res.status(200);
    res.json({ success: true, data: { [docName]: document } });
  });

exports.getAll = (Model) =>
  catchWrapper(async (req, res, next) => {
    const docName = `${Model.collection.collectionName}`;
    let filter = {};
    if (docName === 'reviews' && req.params.id)
      filter = { tour: req.params.id };
    let features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const documents = await features.query;

    res.status(200);
    res.json({
      success: true,
      results: documents.length,
      data: { [docName]: documents },
    });
  });

exports.updateOne = (Model) =>
  catchWrapper(async (req, res, next) => {
    const { id } = req.params;
    const docName = `${Model.collection.collectionName.slice(0, -1)}`;
    const document = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new ErrorRunner(`No ${docName} found with id ${id}`, 404));
    }

    res.status(200);
    res.json({
      success: true,
      data: { [docName]: document },
    });
  });

exports.deleteOne = (Model) =>
  catchWrapper(async (req, res, next) => {
    const { id } = req.params;
    const docName = `${Model.collection.collectionName.slice(0, -1)}`;
    const document = await Model.findByIdAndDelete(id);

    if (!document) {
      return next(new ErrorRunner(`No ${docName} found with id ${id}`, 404));
    }

    res.status(204);
    res.json({ success: true, data: {} });
  });
