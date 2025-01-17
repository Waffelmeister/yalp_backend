import mongoose from "mongoose";
import Script from "./script.js";
import m2s from "mongoose-to-swagger";
import ErrorCodes from "../services/errorCodes.js";
import { shortenSchema } from "../services/utils.js";

export default {
  fullInfo: ["id", "front", "back", "author", "creationDate", "anchor"],
  reducedInfo: ["back", "front"],
  inputInfo: ["back", "front", "anchor"],

  model: mongoose.model(
    "Card",
    mongoose.Schema(
      {
        front: {
          type: String,
          description: "Frage oder Vorderseite einer Lernkarte.",
          required: true,
        },
        back: {
          type: String,
          description: "Antwort oder Rückseite einer Lernkarte",
          required: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          description: "Id des Authors einer Karte",
          required: true,
          immutable: true,
        },
        creationDate: {
          type: Date,
          description: "Erstellungszeit der Karte",
          default: Date.now,
          immutable: true,
        },
        anchor: {
          scriptId: {
            type: mongoose.Types.ObjectId,
            ref: "Script",
            required: true,
          },
          context: {
            type: [Number],
            validate: [
              (array) => {
                if (array.length === 0) {
                  return false;
                } else {
                  return true;
                }
              },
              "Anchor context is required.",
            ],
          },
        },
      },
      {
        toJSON: {
          transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
          },
        },
      }
    )
  ),

  /**
   * Creates an card
   * @param {String} scriptId author
   * @param {String} userId author
   * @param {Object} param1 Card infos
   * @param {String} param1.front
   * @param {String} param1.back
   * @param {String} param1.context
   */
  async create(scriptId, userId, { front, back, anchor }) {
    const script = await Script.get(scriptId, userId);
    let card;
    try {
      card = await this.model.create({
        author: userId,
        front,
        back,
        anchor,
      });
    } catch (e) {
      throw ErrorCodes(4000, e);
    }

    script.cards.push(card._id);
    await script.save();
    return card;
  },

  /**
   * Returns the Card for Id
   * @param {String} cardId
   * @returns {card}
   */
  async get(cardId) {
    const card = await this.model.findOne({ _id: cardId }).lean({
      transform: function (ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    });
    if (!card) throw ErrorCodes(4001);
    return card;
  },

  /**
   * Updates the card
   */
  async update(cardId, userId, { front, back, anchor }) {
    const card = await this.model.findOne({ _id: cardId });

    if (!card) throw ErrorCodes(4001);

    if (front) card.set("front", front);
    if (back) card.set("back", back);
    if (anchor) {
      if (anchor.context) card.set("anchor.context", anchor.context);
    }

    try {
      await card.save();
    } catch (e) {
      throw ErrorCodes(4002, e);
    }

    return card;
  },

  /**
   * Removes the card 
   * @param {String} cardId
   * @param {String} userId
   */
  async delete(cardId) {
    const card = await this.model.findOne({ _id: cardId }).lean();

    if (!card) throw ErrorCodes(4001);

    // Issue URL: https://github.com/Waffelmeister/yalp_backend/issues/42

    return await this.model.deleteOne({ _id: cardId });
  },

  getApiSchema(title, type) {
    return shortenSchema(m2s(this.model), title, this[type]);
  },
};
