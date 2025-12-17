// backend/src/middleware/residentMiddleware.js

export const nbrOfResidentExtension = (basePrisma) => ({
  name: "nbrOfResidentExtension",
  query: {
    resident: {
      async create({ args, query }) {
        const result = await query(args)

        if (result?.householdId) {
          await basePrisma.household.update({
            where: { id: result.householdId },
            data: { nbrOfResident: { increment: 1 } }
          })
        }

        return result
      },

      async delete({ args, query }) {
        const old = await basePrisma.resident.findUnique({
          where: args.where,
          select: { householdId: true }
        })

        const result = await query(args)

        if (old?.householdId) {
          await basePrisma.household.update({
            where: { id: old.householdId },
            data: { nbrOfResident: { decrement: 1 } }
          })
        }

        return result
      },

      async update({ args, query }) {
        const old = await basePrisma.resident.findUnique({
          where: args.where,
          select: { householdId: true }
        })

        const result = await query(args)

        const oldHouseholdId = old?.householdId ?? null
        const newHouseholdId = result?.householdId ?? null

        if (oldHouseholdId !== newHouseholdId) {
          if (oldHouseholdId) {
            await basePrisma.household.update({
              where: { id: oldHouseholdId },
              data: { nbrOfResident: { decrement: 1 } }
            })
          }

          if (newHouseholdId) {
            await basePrisma.household.update({
              where: { id: newHouseholdId },
              data: { nbrOfResident: { increment: 1 } }
            })
          }
        }

        return result
      }
    }
  }
})
