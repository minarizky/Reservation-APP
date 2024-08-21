/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  // Getter for fullName
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** Find all customers. */
  static async all() {
    const results = await db.query(
      `SELECT id, 
              first_name AS "firstName",  
              last_name AS "lastName", 
              phone, 
              notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** Get a customer by ID. */
  static async get(id) {
    const results = await db.query(
      `SELECT id, 
              first_name AS "firstName",  
              last_name AS "lastName", 
              phone, 
              notes 
       FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** Get all reservations for this customer. */
  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** Save this customer. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /** Get the top 10 customers with the most reservations. */
  static async getTopCustomers() {
    const results = await db.query(
      `SELECT customers.id, 
              customers.first_name AS "firstName",  
              customers.last_name AS "lastName", 
              customers.phone, 
              customers.notes, 
              COUNT(reservations.id) AS "numReservations"
       FROM customers
       LEFT JOIN reservations ON customers.id = reservations.customer_id
       GROUP BY customers.id
       ORDER BY "numReservations" DESC
       LIMIT 10`
    );

    return results.rows.map(c => new Customer(c));
  }
}

module.exports = Customer;
