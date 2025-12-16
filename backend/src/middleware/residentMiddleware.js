export const nbrOfResidentExtension = {
  name: "nbrOfResidentExtension",
  query: {
    resident: {
      async create({ args, query }) {
        const result = await query(args)

        if (result.householdId) {
          await this.household.update({
            where: { id: result.householdId },
            data: { nbrOfResident: { increment: 1 } }
          })
        }

        return result
      },

      async delete({ args, query }) {
        const old = await this.resident.findUnique({
          where: args.where
        })

        const result = await query(args)

        if (old?.householdId) {
          await this.household.update({
            where: { id: old.householdId },
            data: { nbrOfResident: { decrement: 1 } }
          })
        }

        return result
      },

      async update({ args, query }) {
        const old = await this.resident.findUnique({
          where: args.where
        })

        const result = await query(args)

        if (old?.householdId !== result.householdId) {
          if (old?.householdId) {
            await this.household.update({
              where: { id: old.householdId },
              data: { nbrOfResident: { decrement: 1 } }
            })
          }

          if (result.householdId) {
            await this.household.update({
              where: { id: result.householdId },
              data: { nbrOfResident: { increment: 1 } }
            })
          }
        }

        return result
      }
    }
  }
}
