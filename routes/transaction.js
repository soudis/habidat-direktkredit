/* jshint esversion: 8 */
const security = require("../utils/security");
const moment = require("moment");
const router = require("express").Router();
const utils = require("../utils");
const models = require("../models");
const multer = require("multer");
const email = require("../utils/email");
const qr = require("../utils/qr");

const umlautMap = {
  "\u00dc": "UE",
  "\u00c4": "AE",
  "\u00d6": "OE",
  "\u00fc": "ue",
  "\u00e4": "ae",
  "\u00f6": "oe",
  "\u00df": "ss",
};

var replaceUmlaute = function (str) {
  return str
    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
      const big = umlautMap[a.slice(0, 1)];
      return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    })
    .replace(
      new RegExp("[" + Object.keys(umlautMap).join("|") + "]", "g"),
      (a) => umlautMap[a]
    );
};

module.exports = function (app) {
  /* GET home page. */
  router.get(
    "/transaction/edit/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.transaction
        .findByPk(req.params.id)
        .then((transaction) => {
          return models.contract
            .findByIdFetchFull(models, transaction.contract_id)
            .then((contract) =>
              utils.render(req, res, "transaction/edit", {
                contract: contract,
                transaction: transaction,
              })
            );
        })
        .catch((error) => next(error));
    }
  );

  /* GET home page. */
  router.get(
    "/transaction/add/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.contract
        .findByIdFetchFull(models, req.params.id)
        .then((contract) =>
          utils.render(req, res, "transaction/add", { contract: contract })
        )
        .catch((error) => next(error));
    }
  );

  router.post(
    "/transaction/add",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      var transaction = {
        transaction_date: moment(req.body.transaction_date).format(
          "YYYY-MM-DD"
        ),
        amount: req.body.amount,
        type: req.body.type,
        contract_id: req.body.contract_id,
        payment_type: req.body.payment_type,
      };
      models.transaction
        .create(transaction, {
          trackOptions: utils.getTrackOptions(req.user, true),
        })
        .then((transaction) => {
          return models.contract
            .findByIdFetchFull(models, req.body.contract_id)
            .then((contract) => {
              if (req.body.send_transaction_email) {
                return models.user
                  .findByIdFetchFull(models, contract.user_id)
                  .then((user) =>
                    email.sendTransactionEmail(
                      req,
                      res,
                      transaction,
                      contract,
                      user
                    )
                  )
                  .then(() => {
                    return contract;
                  });
              } else {
                return contract;
              }
            });
        })
        .then((contract) => {
          return models.file.getContractTemplates().then((templates) =>
            utils.render(req, res, "contract/show", {
              templates_contract: templates,
              contract: contract,
            })
          );
        })
        .catch((error) => next(error));
    }
  );

  router.post(
    "/transaction/edit",
    security.isLoggedInAdmin,
    multer().none(),
    function (req, res, next) {
      models.transaction
        .update(
          {
            transaction_date: moment(req.body.transaction_date),
            amount: parseFloat(req.body.amount),
            type: req.body.type,
            payment_type: req.body.payment_type,
          },
          {
            where: { id: req.body.id },
            trackOptions: utils.getTrackOptions(req.user, true),
          }
        )
        .then(() =>
          models.contract.findByIdFetchFull(models, req.body.contract_id)
        )
        .then((contract) => {
          return models.file.getContractTemplates().then((templates) =>
            utils.render(req, res, "contract/show", {
              templates_contract: templates,
              contract: contract,
            })
          );
        })
        .catch((error) => next(error));
    }
  );

  router.get(
    "/transaction/delete/:id",
    security.isLoggedInAdmin,
    function (req, res, next) {
      models.transaction
        .findByPk(req.params.id)
        .then((transaction) => {
          transaction
            .destroy({ trackOptions: utils.getTrackOptions(req.user, true) })
            .then(() =>
              models.contract.findByIdFetchFull(models, transaction.contract_id)
            )
            .then((contract) => {
              return models.file.getContractTemplates().then((templates) =>
                utils.render(req, res, "contract/show", {
                  templates_contract: templates,
                  contract: contract,
                })
              );
            });
        })
        .catch((error) => next(error));
    }
  );

  router.get(
    "/transaction/qr",
    security.isLoggedInAdmin,
    function (req, res, next) {
      const ids = req.query.ids.split(",");
      models.transaction
        .findAll({
          where: { id: ids },
          include: {model: models.contract, as: "contract", include: {model: models.user, as: "user"}},
        })
        .then((transactions) => {
          if (transactions.length === 0) {
            throw("No transactions found");
          }
          if (transactions.some((transaction) => transaction.contract.user.id !== transactions[0].contract.user.id)) {
            throw("All transactions must belong to the same user");
          }
          const contract = transactions[0].contract;
          const user = contract.user;
          res.setHeader("Content-Type", "image/svg+xml");
          res.send(
            qr.giroCode({
              name: user.getFullName(),
              iban: user.IBAN,
              bic: "",
              amount: Math.abs(transactions.reduce(
                (sum, transaction) => sum + transaction.amount,
                0
              )).toString(),
              reason: transactions.length === 1 ? `${replaceUmlaute(transactions[0].getTypeText())} Direktkredit, Vertragsnummer ${contract.id}, Kontonummer ${user.id}` : `${replaceUmlaute(transactions[0].getTypeText())} ${transactions.length} Direktkredite`,
            })
          );
          res.end();
        })
        .catch((error) => next(error));
    }
  );
  app.use("/", router);
};
