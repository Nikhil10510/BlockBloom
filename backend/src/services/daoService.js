/**
 * DAO Service Layer
 *
 * WHY A SERVICE LAYER:
 *   Controllers handle HTTP concerns (request parsing, response formatting).
 *   Services handle business logic and database queries.
 *   This separation means:
 *     - The same business logic can be reused by REST API, WebSocket handlers,
 *       CLI scripts, or background jobs.
 *     - Controllers stay thin and testable.
 *     - Database queries are centralized — no raw Mongoose calls in controllers.
 */

const { Election } = require('../models');
const { ApiError } = require('../utils');

class DAOService {
  /**
   * Get all Elections (acting as DAOs) with pagination and optional filtering.
   */
  async getAll({ page = 1, limit = 10, creator, sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    const filter = {};
    if (creator) filter.creator = creator.toLowerCase();

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [elections, total] = await Promise.all([
      Election.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Election.countDocuments(filter),
    ]);

    return {
      data: elections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get a single Election by its contract address.
   */
  async getByAddress(contractAddress) {
    const election = await Election.findOne({
      contractAddress: contractAddress.toLowerCase(),
    }).lean();

    if (!election) {
      throw ApiError.notFound(`Election not found at address: ${contractAddress}`);
    }

    return election;
  }

  /**
   * Get aggregate statistics across all Elections.
   */
  async getStats() {
    const [totalDAOs, totalProposals, totalVotes] = await Promise.all([
      Election.countDocuments(),
      Election.aggregate([{ $group: { _id: null, total: { $sum: '$proposalCount' } } }]),
      Election.aggregate([{ $group: { _id: null, total: { $sum: '$totalVotes' } } }]),
    ]);

    return {
      totalDAOs,
      totalProposals: totalProposals[0]?.total || 0,
      totalVotes: totalVotes[0]?.total || 0,
    };
  }
}

module.exports = new DAOService();
